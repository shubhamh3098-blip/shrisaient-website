import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  getDoc,
  collection,
  serverTimestamp, 
  setLogLevel,
  Firestore 
} from 'firebase/firestore';
import type { AppDatabase } from '../utils/storage';
import type { AuthUser } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific database configured for this project
export const firestore: Firestore = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Mute verbose Firestore internal stream logs to prevent backoff spam in console
try {
  setLogLevel('error');
} catch {
  // ignore if not supported in environment
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error' | 'quota-exceeded';

const CHUNK_SIZE = 300; // 300 records per doc is ~120KB, well safe within Firestore 1MB limit

const QUOTA_STORAGE_KEY = 'shri_sai_firestore_quota_exceeded_date';
// The date of the known quota-exhaustion event reported by Google Cloud Firestore
const KNOWN_EXHAUSTED_DATE = '2026-09-12';

function getTodayUtcString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isQuotaError(err: any): boolean {
  const msg = err?.message || String(err || '');
  const code = err?.code || '';
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily write units') ||
    msg.includes('Free daily read units') ||
    msg.includes('quota') ||
    (code === 'unavailable' && (msg.includes('backend') || msg.includes('operation could not be completed')))
  );
}

// In-memory circuit breaker to prevent dispatching any writes when quota is reached
let inMemoryQuotaExceeded: boolean = (() => {
  try {
    const today = getTodayUtcString();
    if (today <= KNOWN_EXHAUSTED_DATE) return true;
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    return saved === today;
  } catch {
    return true;
  }
})();

// Check if quota was exceeded today
export function checkIsQuotaExceededToday(): boolean {
  if (inMemoryQuotaExceeded) return true;
  try {
    const savedDate = localStorage.getItem(QUOTA_STORAGE_KEY);
    const today = getTodayUtcString();
    if (savedDate === today) {
      inMemoryQuotaExceeded = true;
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function recordQuotaExceededToday(): void {
  inMemoryQuotaExceeded = true;
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, getTodayUtcString());
  } catch {
    // ignore
  }
}

export function clearQuotaExceededState(): void {
  inMemoryQuotaExceeded = false;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Helper to remove any undefined values before sending to Firestore
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
}

// Compute lightweight fingerprint of database to skip unnecessary writes
function getDatabaseFingerprint(data: AppDatabase): string {
  const tCount = (data.transactions || []).length;
  const cCount = (data.customers || []).length;
  const mCount = (data.cardMembers || []).length;
  const rCount = (data.cardTransactions || []).length;
  const sCount = (data.stock || []).length;
  const pCount = (data.purchases || []).length;
  const dCount = (data.dealers || []).length;
  const eCount = (data.expenses || []).length;
  const lastTxId = tCount > 0 ? data.transactions[0]?.id : '';
  const lastTxDate = tCount > 0 ? data.transactions[0]?.date : '';
  const lastRcptId = rCount > 0 ? data.cardTransactions[0]?.id : '';
  const settingsTag = data.settings?.businessName || '';
  return `${tCount}_${cCount}_${mCount}_${rCount}_${sCount}_${pCount}_${dCount}_${eCount}_${lastTxId}_${lastTxDate}_${lastRcptId}_${settingsTag}`;
}

/**
 * Saves current database snapshot to Cloud Firestore using partitioned documents
 * so that large imports of bills, cards, or receipts NEVER exceed Firestore 1MB limits.
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingDataToSave: AppDatabase | null = null;
let isSaving = false;
let lastSavedFingerprint = '';
let lastSavedSectionFingerprints: Record<string, string> = {};

// Track existing chunk counts to clean up stale chunks if items are deleted
let lastTransactionChunks = 0;
let lastCardMemberChunks = 0;
let lastCardTransactionChunks = 0;

export async function syncDatabaseToCloud(
  database: AppDatabase, 
  onStatusChange?: (status: CloudSyncStatus, error?: string) => void,
  immediate: boolean = false,
  forceRetry: boolean = false
): Promise<void> {
  // Check if daily quota is already exhausted
  if (!forceRetry && checkIsQuotaExceededToday()) {
    if (onStatusChange) {
      onStatusChange(
        'quota-exceeded',
        'Daily Cloud write quota reached (Free Tier). All changes are safely saved in local storage.'
      );
    }
    return;
  }

  if (forceRetry) {
    clearQuotaExceededState();
  }

  const currentFingerprint = getDatabaseFingerprint(database);
  if (!forceRetry && lastSavedFingerprint && currentFingerprint === lastSavedFingerprint) {
    // Data has not changed since last successful cloud sync
    if (onStatusChange) onStatusChange('connected');
    return;
  }

  pendingDataToSave = database;
  if (onStatusChange) onStatusChange('syncing');

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  const executeSave = async () => {
    if (!pendingDataToSave || isSaving) return;

    if (!forceRetry && checkIsQuotaExceededToday()) {
      pendingDataToSave = null;
      if (onStatusChange) {
        onStatusChange(
          'quota-exceeded',
          'Daily Cloud write quota reached (Free Tier). All changes are safely saved in local storage.'
        );
      }
      return;
    }

    const data = pendingDataToSave;
    pendingDataToSave = null;
    isSaving = true;

    try {
      const sectionsCol = collection(firestore, 'stores', 'shri_sai_enterprise_main', 'sections');
      const nowIso = new Date().toISOString();

      // Step 1: Lightweight single probe write to verify write quota BEFORE dispatching multiple chunk writes
      const probeRef = doc(sectionsCol, 'sync_probe');
      try {
        await setDoc(probeRef, { ping: nowIso }, { merge: true });
      } catch (probeErr: any) {
        if (isQuotaError(probeErr)) {
          recordQuotaExceededToday();
          pendingDataToSave = null;
          console.warn('Firestore daily write quota reached (Free tier). Circuit breaker engaged; all data saved locally.');
          if (onStatusChange) {
            onStatusChange(
              'quota-exceeded',
              'Daily Cloud write quota reached (Free Tier). All changes are safely saved in local storage.'
            );
          }
          return;
        }
        throw probeErr;
      }

      // Step 2: Section-level dirty checking to write ONLY sections that actually changed
      const prevFp = lastSavedSectionFingerprints;
      const transactions = data.transactions || [];
      const cardMembers = data.cardMembers || [];
      const cardTransactions = data.cardTransactions || [];
      const customers = data.customers || [];
      const stock = data.stock || [];
      const purchases = data.purchases || [];
      const dealers = data.dealers || [];
      const dealerPayments = data.dealerPayments || [];
      const staff = data.staff || [];
      const expenses = data.expenses || [];

      const currSettingsFp = JSON.stringify(data.settings || {});
      const currStockFp = `${stock.length}_${stock[0]?.id || ''}`;
      const currCustFp = `${customers.length}_${customers.reduce((sum, c) => sum + (c.balanceDue || 0), 0)}`;
      const currPurchFp = `${purchases.length}_${purchases[0]?.id || ''}`;
      const currDealFp = `${dealers.length}`;
      const currDealPayFp = `${dealerPayments.length}`;
      const currStaffFp = `${staff.length}`;
      const currExpFp = `${expenses.length}`;
      const currTxFp = `${transactions.length}_${transactions[0]?.id || ''}_${transactions[0]?.date || ''}`;
      const currCardMemFp = `${cardMembers.length}_${cardMembers.reduce((sum, m) => sum + (m.totalDeposited || 0), 0)}`;
      const currCardTxFp = `${cardTransactions.length}_${cardTransactions[0]?.id || ''}`;

      const activeSaves: Promise<any>[] = [];

      if (forceRetry || currSettingsFp !== prevFp.settings) {
        activeSaves.push(setDoc(doc(sectionsCol, 'settings'), { data: sanitizeForFirestore(data.settings), updatedAt: nowIso }));
      }
      if (forceRetry || currStockFp !== prevFp.stock) {
        activeSaves.push(setDoc(doc(sectionsCol, 'stock'), { items: sanitizeForFirestore(stock), updatedAt: nowIso }));
      }
      if (forceRetry || currCustFp !== prevFp.customers) {
        activeSaves.push(setDoc(doc(sectionsCol, 'customers'), { items: sanitizeForFirestore(customers), updatedAt: nowIso }));
      }
      if (forceRetry || currPurchFp !== prevFp.purchases) {
        activeSaves.push(setDoc(doc(sectionsCol, 'purchases'), { items: sanitizeForFirestore(purchases), updatedAt: nowIso }));
      }
      if (forceRetry || currDealFp !== prevFp.dealers) {
        activeSaves.push(setDoc(doc(sectionsCol, 'dealers'), { items: sanitizeForFirestore(dealers), updatedAt: nowIso }));
      }
      if (forceRetry || currDealPayFp !== prevFp.dealerPayments) {
        activeSaves.push(setDoc(doc(sectionsCol, 'dealerPayments'), { items: sanitizeForFirestore(dealerPayments), updatedAt: nowIso }));
      }
      if (forceRetry || currStaffFp !== prevFp.staff) {
        activeSaves.push(setDoc(doc(sectionsCol, 'staff'), { items: sanitizeForFirestore(staff), updatedAt: nowIso }));
      }
      if (forceRetry || currExpFp !== prevFp.expenses) {
        activeSaves.push(setDoc(doc(sectionsCol, 'expenses'), { items: sanitizeForFirestore(expenses), updatedAt: nowIso }));
      }

      // Chunked Transactions (Bills) - only if changed
      if (forceRetry || currTxFp !== prevFp.transactions) {
        const txChunkCount = Math.max(1, Math.ceil(transactions.length / CHUNK_SIZE));
        activeSaves.push(
          setDoc(doc(sectionsCol, 'transactions_meta'), { totalItems: transactions.length, chunkCount: txChunkCount, updatedAt: nowIso })
        );
        for (let i = 0; i < txChunkCount; i++) {
          const chunk = transactions.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          activeSaves.push(
            setDoc(doc(sectionsCol, `transactions_chunk_${i}`), {
              items: sanitizeForFirestore(chunk),
              chunkIndex: i,
              updatedAt: nowIso
            })
          );
        }
        for (let i = txChunkCount; i < lastTransactionChunks; i++) {
          activeSaves.push(deleteDoc(doc(sectionsCol, `transactions_chunk_${i}`)));
        }
        lastTransactionChunks = txChunkCount;
      }

      // Chunked Card Members - only if changed
      if (forceRetry || currCardMemFp !== prevFp.cardMembers) {
        const cmChunkCount = Math.max(1, Math.ceil(cardMembers.length / CHUNK_SIZE));
        activeSaves.push(
          setDoc(doc(sectionsCol, 'cardMembers_meta'), { totalItems: cardMembers.length, chunkCount: cmChunkCount, updatedAt: nowIso })
        );
        for (let i = 0; i < cmChunkCount; i++) {
          const chunk = cardMembers.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          activeSaves.push(
            setDoc(doc(sectionsCol, `cardMembers_chunk_${i}`), {
              items: sanitizeForFirestore(chunk),
              chunkIndex: i,
              updatedAt: nowIso
            })
          );
        }
        for (let i = cmChunkCount; i < lastCardMemberChunks; i++) {
          activeSaves.push(deleteDoc(doc(sectionsCol, `cardMembers_chunk_${i}`)));
        }
        lastCardMemberChunks = cmChunkCount;
      }

      // Chunked Card Transactions (Receipts) - only if changed
      if (forceRetry || currCardTxFp !== prevFp.cardTransactions) {
        const ctxChunkCount = Math.max(1, Math.ceil(cardTransactions.length / CHUNK_SIZE));
        activeSaves.push(
          setDoc(doc(sectionsCol, 'cardTransactions_meta'), { totalItems: cardTransactions.length, chunkCount: ctxChunkCount, updatedAt: nowIso })
        );
        for (let i = 0; i < ctxChunkCount; i++) {
          const chunk = cardTransactions.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          activeSaves.push(
            setDoc(doc(sectionsCol, `cardTransactions_chunk_${i}`), {
              items: sanitizeForFirestore(chunk),
              chunkIndex: i,
              updatedAt: nowIso
            })
          );
        }
        for (let i = ctxChunkCount; i < lastCardTransactionChunks; i++) {
          activeSaves.push(deleteDoc(doc(sectionsCol, `cardTransactions_chunk_${i}`)));
        }
        lastCardTransactionChunks = ctxChunkCount;
      }

      // Root summary document
      const mainStoreRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
      activeSaves.push(setDoc(mainStoreRef, {
        updatedAt: nowIso,
        serverTime: serverTimestamp(),
        domain: 'shrisaient.in',
        stats: {
          transactionsCount: transactions.length,
          cardMembersCount: cardMembers.length,
          cardTransactionsCount: cardTransactions.length,
          customersCount: customers.length,
          stockCount: stock.length,
        }
      }, { merge: true }));

      await Promise.all(activeSaves);

      lastSavedFingerprint = currentFingerprint;
      lastSavedSectionFingerprints = {
        settings: currSettingsFp,
        stock: currStockFp,
        customers: currCustFp,
        purchases: currPurchFp,
        dealers: currDealFp,
        dealerPayments: currDealPayFp,
        staff: currStaffFp,
        expenses: currExpFp,
        transactions: currTxFp,
        cardMembers: currCardMemFp,
        cardTransactions: currCardTxFp,
      };

      if (onStatusChange) onStatusChange('connected');
    } catch (err: any) {
      if (isQuotaError(err)) {
        recordQuotaExceededToday();
        pendingDataToSave = null;
        console.warn('Firestore daily write quota reached (Free tier). LocalStorage fallback active.');
        if (onStatusChange) {
          onStatusChange(
            'quota-exceeded',
            'Daily Cloud write quota reached (Free Tier). All changes are safely saved in local storage.'
          );
        }
      } else {
        console.warn('Cloud sync error (persisted locally):', err);
        if (onStatusChange) onStatusChange('error', err?.message || 'Sync failed');
      }
    } finally {
      isSaving = false;
      if (pendingDataToSave && !checkIsQuotaExceededToday()) {
        saveTimeout = setTimeout(executeSave, 2000);
      }
    }
  };

  if (immediate) {
    await executeSave();
  } else {
    // Generous debounce of 2000ms to avoid burning write quota on rapid updates
    saveTimeout = setTimeout(executeSave, 2000);
  }
}

/**
 * Records a successful login event in Cloud Firestore for secure audit tracking.
 */
export async function logAuthEventToCloud(user: AuthUser): Promise<void> {
  if (checkIsQuotaExceededToday()) return;
  try {
    const storeRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
    const loginRecord = {
      id: `login-${Date.now()}`,
      email: user.email,
      name: user.name,
      role: user.role,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };
    await setDoc(
      storeRef,
      {
        lastLogin: loginRecord,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    if (isQuotaError(err)) {
      recordQuotaExceededToday();
    }
    console.warn('Could not record login audit to Firestore:', err);
  }
}

/**
 * Listens in REAL TIME to changes in Cloud Firestore using the partitioned subcollection.
 * When a bill, card entry, or customer is added on mobile or another PC,
 * this callback will immediately update the local state without size limit issues.
 */
export function subscribeToCloudDatabase(
  onDataReceived: (remoteData: AppDatabase) => void,
  onStatusChange?: (status: CloudSyncStatus, error?: string) => void,
  initialFallback?: AppDatabase
): () => void {
  if (onStatusChange) onStatusChange('syncing');

  const sectionsCol = collection(firestore, 'stores', 'shri_sai_enterprise_main', 'sections');

  const unsubscribe = onSnapshot(
    sectionsCol,
    async (snapshot) => {
      if (!snapshot.empty) {
        let settings: any = undefined;
        let stock: any[] = [];
        let customers: any[] = [];
        let purchases: any[] = [];
        let dealers: any[] = [];
        let dealerPayments: any[] = [];
        let staff: any[] = [];
        let expenses: any[] = [];

        const txChunks: Record<number, any[]> = {};
        const cmChunks: Record<number, any[]> = {};
        const ctxChunks: Record<number, any[]> = {};

        snapshot.forEach((docSnap) => {
          const id = docSnap.id;
          const docData = docSnap.data();
          if (!docData) return;

          if (id === 'settings' && docData.data) {
            settings = docData.data;
          } else if (id === 'stock' && Array.isArray(docData.items)) {
            stock = docData.items;
          } else if (id === 'customers' && Array.isArray(docData.items)) {
            customers = docData.items;
          } else if (id === 'purchases' && Array.isArray(docData.items)) {
            purchases = docData.items;
          } else if (id === 'dealers' && Array.isArray(docData.items)) {
            dealers = docData.items;
          } else if (id === 'dealerPayments' && Array.isArray(docData.items)) {
            dealerPayments = docData.items;
          } else if (id === 'staff' && Array.isArray(docData.items)) {
            staff = docData.items;
          } else if (id === 'expenses' && Array.isArray(docData.items)) {
            expenses = docData.items;
          } else if (id.startsWith('transactions_chunk_')) {
            const idx = parseInt(id.replace('transactions_chunk_', ''), 10);
            if (!isNaN(idx) && Array.isArray(docData.items)) {
              txChunks[idx] = docData.items;
            }
          } else if (id.startsWith('cardMembers_chunk_')) {
            const idx = parseInt(id.replace('cardMembers_chunk_', ''), 10);
            if (!isNaN(idx) && Array.isArray(docData.items)) {
              cmChunks[idx] = docData.items;
            }
          } else if (id.startsWith('cardTransactions_chunk_')) {
            const idx = parseInt(id.replace('cardTransactions_chunk_', ''), 10);
            if (!isNaN(idx) && Array.isArray(docData.items)) {
              ctxChunks[idx] = docData.items;
            }
          }
        });

        // Assemble transactions in index order
        const transactions: any[] = [];
        Object.keys(txChunks).map(Number).sort((a, b) => a - b).forEach((k) => {
          transactions.push(...txChunks[k]);
        });

        // Assemble card members in index order
        const cardMembers: any[] = [];
        Object.keys(cmChunks).map(Number).sort((a, b) => a - b).forEach((k) => {
          cardMembers.push(...cmChunks[k]);
        });

        // Assemble card transactions in index order
        const cardTransactions: any[] = [];
        Object.keys(ctxChunks).map(Number).sort((a, b) => a - b).forEach((k) => {
          cardTransactions.push(...ctxChunks[k]);
        });

        const parsedData: AppDatabase = {
          settings: settings || initialFallback?.settings || {
            businessName: 'SHRI SAI ENTERPRISES',
            phone: '8766486915',
            address: 'Wardha',
            gstin: '',
            domainName: 'shrisaienterpriseswardha.shop',
            upiId: 'shrisaienterprises@okaxis',
          },
          stock: (stock || []).map((s: any) => ({
            ...s,
            sellingPrice: Number(s?.sellingPrice || 0),
            purchasePrice: Number(s?.purchasePrice || 0),
            quantity: Number(s?.quantity || 0),
          })),
          customers: (customers || []).map((c: any) => ({
            ...c,
            balanceDue: Number(c?.balanceDue || 0),
            totalPurchased: Number(c?.totalPurchased || 0),
            totalPaid: Number(c?.totalPaid || 0),
          })),
          transactions: (transactions || []).map((t: any) => ({
            ...t,
            totalAmount: Number(t?.totalAmount || 0),
            payingNow: Number(t?.payingNow || 0),
            dueAmount: Number(t?.dueAmount || 0),
          })),
          purchases: purchases || [],
          dealers: dealers || [],
          dealerPayments: dealerPayments || [],
          cardMembers: (cardMembers || []).map((cm: any) => ({
            ...cm,
            totalDeposited: Number(cm?.totalDeposited || 0),
            totalRefunded: Number(cm?.totalRefunded || 0),
            netBalance: Number(cm?.netBalance || 0),
          })),
          cardTransactions: cardTransactions || [],
          staff: staff || [],
          expenses: expenses || [],
        };

        onDataReceived(parsedData);
        if (onStatusChange) onStatusChange('connected');
      } else {
        // Subcollection empty: fallback to root doc or initialFallback
        try {
          const rootRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
          const rootSnap = await getDoc(rootRef);
          if (rootSnap.exists() && rootSnap.data()?.transactions) {
            const rootData = rootSnap.data()!;
            onDataReceived({
              settings: rootData.settings,
              stock: rootData.stock || [],
              customers: rootData.customers || [],
              transactions: rootData.transactions || [],
              purchases: rootData.purchases || [],
              dealers: rootData.dealers || [],
              dealerPayments: rootData.dealerPayments || [],
              cardMembers: rootData.cardMembers || [],
              cardTransactions: rootData.cardTransactions || [],
              staff: rootData.staff || [],
              expenses: rootData.expenses || [],
            });
          } else if (initialFallback) {
            onDataReceived(initialFallback);
          }
        } catch (e) {
          console.warn('Fallback read error:', e);
        }
        if (onStatusChange) onStatusChange('connected');
      }
    },
    (error) => {
      if (isQuotaError(error)) {
        recordQuotaExceededToday();
        console.warn('Firestore subscription quota limit reached.');
        if (onStatusChange) onStatusChange('quota-exceeded', 'Firestore quota limit reached for today.');
      } else {
        console.warn('Firestore subscription error:', error);
        if (onStatusChange) onStatusChange('offline', error.message);
      }
    }
  );

  return unsubscribe;
}

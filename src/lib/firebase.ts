import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  getDoc,
  getDocs,
  collection,
  serverTimestamp, 
  setLogLevel,
  Firestore 
} from 'firebase/firestore';
import type { AppDatabase } from '../utils/storage';
import type { AuthUser } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific database configured for this project
// Use experimentalForceLongPolling to avoid WebChannel stream failures in sandboxed iframes & proxies
export const firestore: Firestore = (() => {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, dbId);
  } catch {
    return getFirestore(app, dbId);
  }
})();

// Suppress verbose internal WebChannel/long-polling reconnection logs
try {
  setLogLevel('silent');
} catch {
  // ignore if not supported in environment
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error' | 'quota-exceeded';

const CHUNK_SIZE = 300; // 300 records per doc is ~120KB, well safe within Firestore 1MB limit

const QUOTA_STORAGE_KEY = 'shri_sai_firestore_quota_exceeded_date';

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
    (msg.includes('quota') && !msg.includes('offline') && !msg.includes('unavailable'))
  );
}

// In-memory circuit breaker to prevent dispatching any writes when quota is genuinely reached
let inMemoryQuotaExceeded: boolean = (() => {
  try {
    const today = getTodayUtcString();
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    return saved === today;
  } catch {
    return false;
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

/**
 * Directly clears specific partitions in Cloud Firestore and overwrites metadata
 * with totalItems: 0, chunkCount: 0 so no stale or orphaned chunks get loaded.
 */
export async function clearCloudSection(
  section: 'all' | 'cards' | 'bills' | 'customers'
): Promise<void> {
  const sectionsCol = collection(firestore, 'stores', 'shri_sai_enterprise_main', 'sections');
  const nowIso = new Date().toISOString();
  const ops: Promise<any>[] = [];

  if (section === 'all' || section === 'cards') {
    ops.push(setDoc(doc(sectionsCol, 'cardMembers_meta'), { totalItems: 0, chunkCount: 0, updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'cardTransactions_meta'), { totalItems: 0, chunkCount: 0, updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'cardMembers_chunk_0'), { items: [], chunkIndex: 0, updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'cardTransactions_chunk_0'), { items: [], chunkIndex: 0, updatedAt: nowIso }));
    for (let i = 1; i < 30; i++) {
      ops.push(deleteDoc(doc(sectionsCol, `cardMembers_chunk_${i}`)).catch(() => {}));
      ops.push(deleteDoc(doc(sectionsCol, `cardTransactions_chunk_${i}`)).catch(() => {}));
    }
  }

  if (section === 'all' || section === 'bills') {
    ops.push(setDoc(doc(sectionsCol, 'transactions_meta'), { totalItems: 0, chunkCount: 0, updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'customers'), { items: [], updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'transactions_chunk_0'), { items: [], chunkIndex: 0, updatedAt: nowIso }));
    for (let i = 1; i < 30; i++) {
      ops.push(deleteDoc(doc(sectionsCol, `transactions_chunk_${i}`)).catch(() => {}));
    }
  }

  if (section === 'all') {
    ops.push(setDoc(doc(sectionsCol, 'purchases'), { items: [], updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'dealers'), { items: [], updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'dealerPayments'), { items: [], updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'expenses'), { items: [], updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'agentAdvances'), { items: [], updatedAt: nowIso }));
    ops.push(setDoc(doc(sectionsCol, 'staff'), { items: [], updatedAt: nowIso }));
  }

  if (section === 'customers') {
    ops.push(setDoc(doc(sectionsCol, 'customers'), { items: [], updatedAt: nowIso }));
  }

  const mainStoreRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
  ops.push(
    setDoc(
      mainStoreRef,
      {
        updatedAt: nowIso,
        clearedAt: nowIso,
        clearedSection: section,
      },
      { merge: true }
    )
  );

  lastSavedFingerprint = '';
  lastSavedSectionFingerprints = {};

  try {
    await Promise.all(ops);
  } catch (err) {
    console.warn('clearCloudSection note:', err);
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
  const tList = data.transactions || [];
  const cList = data.customers || [];
  const mList = data.cardMembers || [];
  const rList = data.cardTransactions || [];
  const sList = data.stock || [];
  const pList = data.purchases || [];
  const dList = data.dealers || [];
  const eList = data.expenses || [];
  const aList = data.agentAdvances || [];

  const tSum = tList.reduce((sum, t) => sum + (t.totalAmount || 0) + (t.payingNow || 0), 0);
  const mSum = mList.reduce((sum, m) => sum + (m.totalDeposited || 0) + (m.netBalance || 0), 0);
  const rSum = rList.reduce((sum, r) => sum + (r.amount || 0), 0);
  const aSum = aList.reduce((sum, a) => sum + (a.amount || 0), 0);
  const cSum = cList.reduce((sum, c) => sum + (c.balanceDue || 0), 0);
  const sSum = sList.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const eSum = eList.reduce((sum, e) => sum + (e.amount || 0), 0);

  const lastTxId = tList.length > 0 ? tList[0]?.id : '';
  const lastRcptId = rList.length > 0 ? rList[0]?.id : '';
  const lastAdvId = aList.length > 0 ? aList[0]?.id : '';
  const settingsTag = data.settings?.businessName || '';
  return `${tList.length}_${tSum}_${cList.length}_${cSum}_${mList.length}_${mSum}_${rList.length}_${rSum}_${sList.length}_${sSum}_${pList.length}_${dList.length}_${eList.length}_${eSum}_${aList.length}_${aSum}_${lastTxId}_${lastRcptId}_${lastAdvId}_${settingsTag}`;
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
        if (probeErr?.code === 'unavailable' || probeErr?.message?.includes('offline') || probeErr?.message?.includes('backend')) {
          console.info('Cloud sync deferred: offline mode (data saved in localStorage).');
          if (onStatusChange) onStatusChange('offline', 'Offline mode (saved locally)');
          return;
        }
        if (probeErr?.code === 'permission-denied') {
          console.info('Cloud sync deferred: local mode active.');
          if (onStatusChange) onStatusChange('offline', 'Local mode active');
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
      const agentAdvances = data.agentAdvances || [];

      const currSettingsFp = JSON.stringify(data.settings || {});
      const currStockFp = `${stock.length}_${stock.reduce((sum, s) => sum + (s.quantity || 0) + (s.sellingPrice || 0), 0)}_${stock[0]?.id || ''}`;
      const currCustFp = `${customers.length}_${customers.reduce((sum, c) => sum + (c.balanceDue || 0), 0)}`;
      const currPurchFp = `${purchases.length}_${purchases[0]?.id || ''}`;
      const currDealFp = `${dealers.length}_${dealers.reduce((sum, d) => sum + (d.totalPurchases || 0) + (d.totalPaid || 0), 0)}`;
      const currDealPayFp = `${dealerPayments.length}_${dealerPayments.reduce((sum, dp) => sum + (dp.amount || 0), 0)}`;
      const currStaffFp = `${staff.length}_${staff.map((s) => s.attendanceToday).join('')}`;
      const currExpFp = `${expenses.length}_${expenses.reduce((sum, e) => sum + (e.amount || 0), 0)}`;
      const currAdvFp = `${agentAdvances.length}_${agentAdvances.reduce((sum, a) => sum + (a.amount || 0), 0)}_${agentAdvances[0]?.id || ''}`;
      const currTxFp = `${transactions.length}_${transactions.reduce((sum, t) => sum + (t.totalAmount || 0) + (t.payingNow || 0), 0)}_${transactions[0]?.id || ''}_${transactions[transactions.length - 1]?.id || ''}`;
      const currCardMemFp = `${cardMembers.length}_${cardMembers.reduce((sum, m) => sum + (m.totalDeposited || 0) + (m.netBalance || 0), 0)}_${cardMembers[0]?.id || ''}`;
      const currCardTxFp = `${cardTransactions.length}_${cardTransactions.reduce((sum, r) => sum + (r.amount || 0), 0)}_${cardTransactions[0]?.id || ''}_${cardTransactions[cardTransactions.length - 1]?.id || ''}`;

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
      if (forceRetry || currAdvFp !== prevFp.agentAdvances) {
        activeSaves.push(setDoc(doc(sectionsCol, 'agentAdvances'), { items: sanitizeForFirestore(agentAdvances), updatedAt: nowIso }));
      }

      // Chunked Transactions (Bills) - only if changed
      if (forceRetry || currTxFp !== prevFp.transactions) {
        const txChunkCount = transactions.length === 0 ? 0 : Math.ceil(transactions.length / CHUNK_SIZE);
        activeSaves.push(
          setDoc(doc(sectionsCol, 'transactions_meta'), { totalItems: transactions.length, chunkCount: txChunkCount, updatedAt: nowIso })
        );
        if (txChunkCount === 0) {
          activeSaves.push(
            setDoc(doc(sectionsCol, 'transactions_chunk_0'), { items: [], chunkIndex: 0, updatedAt: nowIso })
          );
        }
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
        const cleanupUpto = Math.max(lastTransactionChunks, 30);
        for (let i = Math.max(1, txChunkCount); i < cleanupUpto; i++) {
          activeSaves.push(deleteDoc(doc(sectionsCol, `transactions_chunk_${i}`)).catch(() => {}));
        }
        lastTransactionChunks = txChunkCount;
      }

      // Chunked Card Members - only if changed
      if (forceRetry || currCardMemFp !== prevFp.cardMembers) {
        const cmChunkCount = cardMembers.length === 0 ? 0 : Math.ceil(cardMembers.length / CHUNK_SIZE);
        activeSaves.push(
          setDoc(doc(sectionsCol, 'cardMembers_meta'), { totalItems: cardMembers.length, chunkCount: cmChunkCount, updatedAt: nowIso })
        );
        if (cmChunkCount === 0) {
          activeSaves.push(
            setDoc(doc(sectionsCol, 'cardMembers_chunk_0'), { items: [], chunkIndex: 0, updatedAt: nowIso })
          );
        }
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
        const cleanupUpto = Math.max(lastCardMemberChunks, 30);
        for (let i = Math.max(1, cmChunkCount); i < cleanupUpto; i++) {
          activeSaves.push(deleteDoc(doc(sectionsCol, `cardMembers_chunk_${i}`)).catch(() => {}));
        }
        lastCardMemberChunks = cmChunkCount;
      }

      // Chunked Card Transactions (Receipts) - only if changed
      if (forceRetry || currCardTxFp !== prevFp.cardTransactions) {
        const ctxChunkCount = cardTransactions.length === 0 ? 0 : Math.ceil(cardTransactions.length / CHUNK_SIZE);
        activeSaves.push(
          setDoc(doc(sectionsCol, 'cardTransactions_meta'), { totalItems: cardTransactions.length, chunkCount: ctxChunkCount, updatedAt: nowIso })
        );
        if (ctxChunkCount === 0) {
          activeSaves.push(
            setDoc(doc(sectionsCol, 'cardTransactions_chunk_0'), { items: [], chunkIndex: 0, updatedAt: nowIso })
          );
        }
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
        const cleanupUpto = Math.max(lastCardTransactionChunks, 30);
        for (let i = Math.max(1, ctxChunkCount); i < cleanupUpto; i++) {
          activeSaves.push(deleteDoc(doc(sectionsCol, `cardTransactions_chunk_${i}`)).catch(() => {}));
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
        agentAdvances: currAdvFp,
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
      } else if (err?.code === 'unavailable' || err?.message?.includes('offline') || err?.message?.includes('backend')) {
        console.info('Cloud sync deferred: offline mode (data saved in localStorage).');
        if (onStatusChange) onStatusChange('offline', 'Offline mode (saved locally)');
      } else if (err?.code === 'permission-denied') {
        console.info('Cloud sync deferred: local mode active.');
        if (onStatusChange) onStatusChange('offline', 'Local mode active');
      } else {
        console.warn('Cloud sync error (persisted locally):', err);
        if (onStatusChange) onStatusChange('error', err?.message || 'Sync failed');
      }
    } finally {
      isSaving = false;
      if (pendingDataToSave && !checkIsQuotaExceededToday()) {
        saveTimeout = setTimeout(executeSave, 300);
      }
    }
  };

  if (immediate) {
    await executeSave();
  } else {
    // Ultra-fast 300ms debounce to sync to cloud rapidly across agent mobiles and shop computers
    saveTimeout = setTimeout(executeSave, 300);
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
        let agentAdvances: any[] = [];

        const txChunks: Record<number, any[]> = {};
        const cmChunks: Record<number, any[]> = {};
        const ctxChunks: Record<number, any[]> = {};
        let txMeta: { totalItems?: number; chunkCount?: number } | null = null;
        let cmMeta: { totalItems?: number; chunkCount?: number } | null = null;
        let ctxMeta: { totalItems?: number; chunkCount?: number } | null = null;

        snapshot.forEach((docSnap) => {
          const id = docSnap.id;
          const docData = docSnap.data();
          if (!docData) return;

          if (id === 'transactions_meta') {
            txMeta = docData as any;
          } else if (id === 'cardMembers_meta') {
            cmMeta = docData as any;
          } else if (id === 'cardTransactions_meta') {
            ctxMeta = docData as any;
          } else if (id === 'settings' && docData.data) {
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
          } else if (id === 'agentAdvances' && Array.isArray(docData.items)) {
            agentAdvances = docData.items;
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

        // Assemble transactions in index order, respecting meta chunkCount
        const transactions: any[] = [];
        if (txMeta && (txMeta.chunkCount === 0 || txMeta.totalItems === 0)) {
          // Explicitly cleared or empty
        } else {
          const maxTxChunks = txMeta && typeof txMeta.chunkCount === 'number' ? txMeta.chunkCount : 9999;
          Object.keys(txChunks).map(Number).sort((a, b) => a - b).forEach((k) => {
            if (k < maxTxChunks && Array.isArray(txChunks[k])) {
              transactions.push(...txChunks[k]);
            }
          });
        }

        // Assemble card members in index order, respecting meta chunkCount
        const cardMembers: any[] = [];
        if (cmMeta && (cmMeta.chunkCount === 0 || cmMeta.totalItems === 0)) {
          // Explicitly cleared or empty
        } else {
          const maxCmChunks = cmMeta && typeof cmMeta.chunkCount === 'number' ? cmMeta.chunkCount : 9999;
          Object.keys(cmChunks).map(Number).sort((a, b) => a - b).forEach((k) => {
            if (k < maxCmChunks && Array.isArray(cmChunks[k])) {
              cardMembers.push(...cmChunks[k]);
            }
          });
        }

        // Assemble card transactions in index order, respecting meta chunkCount
        const cardTransactions: any[] = [];
        if (ctxMeta && (ctxMeta.chunkCount === 0 || ctxMeta.totalItems === 0)) {
          // Explicitly cleared or empty
        } else {
          const maxCtxChunks = ctxMeta && typeof ctxMeta.chunkCount === 'number' ? ctxMeta.chunkCount : 9999;
          Object.keys(ctxChunks).map(Number).sort((a, b) => a - b).forEach((k) => {
            if (k < maxCtxChunks && Array.isArray(ctxChunks[k])) {
              cardTransactions.push(...ctxChunks[k]);
            }
          });
        }

        const isDemoCust = (c: any) => c?.id && (c.id.startsWith('cust-bhagat') || c.id.startsWith('demo-') || c.id.includes('placeholder'));
        const isDemoCard = (m: any) => m?.id && (m.id.startsWith('cm-demo') || m.id.startsWith('card-demo') || m.id.startsWith('demo-'));
        const isDemoTx = (t: any) => t?.id && (t.id.startsWith('tx-bhagat') || t.id.startsWith('tx-demo') || t.id.startsWith('demo-'));
        const isDemoPur = (p: any) => p?.id && (p.id.startsWith('pur-demo') || p.id.startsWith('demo-'));
        const isDemoDlr = (d: any) => d?.id && (d.id.startsWith('dlr-demo') || d.id.startsWith('demo-'));
        const isDemoStaff = (s: any) => s?.id && (s.id.startsWith('stf-demo') || s.id.startsWith('demo-'));

        const cleanCustomers = (customers || []).filter((c: any) => !isDemoCust(c));
        const cleanTransactions = (transactions || []).filter((t: any) => !isDemoTx(t));
        const cleanPurchases = (purchases || []).filter((p: any) => !isDemoPur(p));
        const cleanDealers = (dealers || []).filter((d: any) => !isDemoDlr(d));
        const cleanCardMembers = (cardMembers || []).filter((cm: any) => !isDemoCard(cm));
        const cleanStaff = (staff || []).filter((s: any) => !isDemoStaff(s));

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
          customers: cleanCustomers.map((c: any) => ({
            ...c,
            balanceDue: Number(c?.balanceDue || 0),
            totalPurchased: Number(c?.totalPurchased || 0),
            totalPaid: Number(c?.totalPaid || 0),
          })),
          transactions: cleanTransactions.map((t: any) => ({
            ...t,
            totalAmount: Number(t?.totalAmount || 0),
            payingNow: Number(t?.payingNow || 0),
            dueAmount: Number(t?.dueAmount || 0),
          })),
          purchases: cleanPurchases,
          dealers: cleanDealers,
          dealerPayments: dealerPayments || [],
          cardMembers: cleanCardMembers.map((cm: any) => ({
            ...cm,
            totalDeposited: Number(cm?.totalDeposited || 0),
            totalRefunded: Number(cm?.totalRefunded || 0),
            netBalance: Number(cm?.netBalance || 0),
          })),
          cardTransactions: cardTransactions || [],
          staff: cleanStaff,
          expenses: expenses || [],
          agentAdvances: agentAdvances || [],
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
              agentAdvances: rootData.agentAdvances || [],
            });
          } else if (initialFallback) {
            onDataReceived(initialFallback);
          }
        } catch (e) {
          // If offline or using local cache, silently use local data without console noise
          if (e instanceof Error && !e.message.includes('offline') && !e.message.includes('unavailable')) {
            console.warn('Cloud sync read notice:', e.message);
          }
        }
        if (onStatusChange) onStatusChange('connected');
      }
    },
    (error) => {
      if (isQuotaError(error)) {
        recordQuotaExceededToday();
        console.warn('Firestore subscription quota limit reached.');
        if (onStatusChange) onStatusChange('quota-exceeded', 'Firestore quota limit reached for today.');
      } else if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('backend')) {
        console.info('Firestore offline mode active (using local database).');
        if (onStatusChange) onStatusChange('offline', 'Operating in offline mode');
      } else if (error?.code === 'permission-denied') {
        console.info('Firestore local mode active.');
        if (onStatusChange) onStatusChange('offline', 'Local mode active');
      } else {
        console.warn('Firestore subscription notice:', error.message);
        if (onStatusChange) onStatusChange('offline', error.message);
      }
    }
  );

  return unsubscribe;
}

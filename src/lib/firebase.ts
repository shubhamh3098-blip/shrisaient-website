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

export type CloudSyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error';

const CHUNK_SIZE = 300; // 300 records per doc is ~120KB, well safe within Firestore 1MB limit

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

/**
 * Saves current database snapshot to Cloud Firestore using partitioned documents
 * so that large imports of bills, cards, or receipts NEVER exceed Firestore 1MB limits.
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingDataToSave: AppDatabase | null = null;
let isSaving = false;

// Track existing chunk counts to clean up stale chunks if items are deleted
let lastTransactionChunks = 0;
let lastCardMemberChunks = 0;
let lastCardTransactionChunks = 0;

export async function syncDatabaseToCloud(
  database: AppDatabase, 
  onStatusChange?: (status: CloudSyncStatus, error?: string) => void,
  immediate: boolean = false
): Promise<void> {
  pendingDataToSave = database;
  if (onStatusChange) onStatusChange('syncing');

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  const executeSave = async () => {
    if (!pendingDataToSave || isSaving) return;
    const data = pendingDataToSave;
    pendingDataToSave = null;
    isSaving = true;

    try {
      const sectionsCol = collection(firestore, 'stores', 'shri_sai_enterprise_main', 'sections');
      const nowIso = new Date().toISOString();

      // 1. Single/Small sections
      const singleSaves = [
        setDoc(doc(sectionsCol, 'settings'), { data: sanitizeForFirestore(data.settings), updatedAt: nowIso }),
        setDoc(doc(sectionsCol, 'stock'), { items: sanitizeForFirestore(data.stock || []), updatedAt: nowIso }),
        setDoc(doc(sectionsCol, 'customers'), { items: sanitizeForFirestore(data.customers || []), updatedAt: nowIso }),
        setDoc(doc(sectionsCol, 'purchases'), { items: sanitizeForFirestore(data.purchases || []), updatedAt: nowIso }),
        setDoc(doc(sectionsCol, 'dealers'), { items: sanitizeForFirestore(data.dealers || []), updatedAt: nowIso }),
        setDoc(doc(sectionsCol, 'dealerPayments'), { items: sanitizeForFirestore(data.dealerPayments || []), updatedAt: nowIso }),
        setDoc(doc(sectionsCol, 'staff'), { items: sanitizeForFirestore(data.staff || []), updatedAt: nowIso }),
        setDoc(doc(sectionsCol, 'expenses'), { items: sanitizeForFirestore(data.expenses || []), updatedAt: nowIso }),
      ];

      // 2. Chunked Transactions (Bills)
      const transactions = data.transactions || [];
      const txChunkCount = Math.max(1, Math.ceil(transactions.length / CHUNK_SIZE));
      const txSaves: Promise<any>[] = [
        setDoc(doc(sectionsCol, 'transactions_meta'), { totalItems: transactions.length, chunkCount: txChunkCount, updatedAt: nowIso })
      ];
      for (let i = 0; i < txChunkCount; i++) {
        const chunk = transactions.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        txSaves.push(
          setDoc(doc(sectionsCol, `transactions_chunk_${i}`), {
            items: sanitizeForFirestore(chunk),
            chunkIndex: i,
            updatedAt: nowIso
          })
        );
      }
      // Delete old unused transaction chunks
      for (let i = txChunkCount; i < lastTransactionChunks; i++) {
        txSaves.push(deleteDoc(doc(sectionsCol, `transactions_chunk_${i}`)));
      }
      lastTransactionChunks = txChunkCount;

      // 3. Chunked Card Members
      const cardMembers = data.cardMembers || [];
      const cmChunkCount = Math.max(1, Math.ceil(cardMembers.length / CHUNK_SIZE));
      const cmSaves: Promise<any>[] = [
        setDoc(doc(sectionsCol, 'cardMembers_meta'), { totalItems: cardMembers.length, chunkCount: cmChunkCount, updatedAt: nowIso })
      ];
      for (let i = 0; i < cmChunkCount; i++) {
        const chunk = cardMembers.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        cmSaves.push(
          setDoc(doc(sectionsCol, `cardMembers_chunk_${i}`), {
            items: sanitizeForFirestore(chunk),
            chunkIndex: i,
            updatedAt: nowIso
          })
        );
      }
      for (let i = cmChunkCount; i < lastCardMemberChunks; i++) {
        cmSaves.push(deleteDoc(doc(sectionsCol, `cardMembers_chunk_${i}`)));
      }
      lastCardMemberChunks = cmChunkCount;

      // 4. Chunked Card Transactions (Receipts)
      const cardTransactions = data.cardTransactions || [];
      const ctxChunkCount = Math.max(1, Math.ceil(cardTransactions.length / CHUNK_SIZE));
      const ctxSaves: Promise<any>[] = [
        setDoc(doc(sectionsCol, 'cardTransactions_meta'), { totalItems: cardTransactions.length, chunkCount: ctxChunkCount, updatedAt: nowIso })
      ];
      for (let i = 0; i < ctxChunkCount; i++) {
        const chunk = cardTransactions.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        ctxSaves.push(
          setDoc(doc(sectionsCol, `cardTransactions_chunk_${i}`), {
            items: sanitizeForFirestore(chunk),
            chunkIndex: i,
            updatedAt: nowIso
          })
        );
      }
      for (let i = ctxChunkCount; i < lastCardTransactionChunks; i++) {
        ctxSaves.push(deleteDoc(doc(sectionsCol, `cardTransactions_chunk_${i}`)));
      }
      lastCardTransactionChunks = ctxChunkCount;

      // 5. Root summary document
      const mainStoreRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
      const rootSave = setDoc(mainStoreRef, {
        updatedAt: nowIso,
        serverTime: serverTimestamp(),
        domain: 'shrisaient.in',
        stats: {
          transactionsCount: transactions.length,
          cardMembersCount: cardMembers.length,
          cardTransactionsCount: cardTransactions.length,
          customersCount: (data.customers || []).length,
          stockCount: (data.stock || []).length,
        }
      }, { merge: true });

      await Promise.all([
        ...singleSaves,
        ...txSaves,
        ...cmSaves,
        ...ctxSaves,
        rootSave
      ]);

      if (onStatusChange) onStatusChange('connected');
    } catch (err: any) {
      console.warn('Cloud sync error (persisted locally):', err);
      if (onStatusChange) onStatusChange('error', err?.message || 'Sync failed');
    } finally {
      isSaving = false;
      if (pendingDataToSave) {
        saveTimeout = setTimeout(executeSave, 300);
      }
    }
  };

  if (immediate) {
    await executeSave();
  } else {
    saveTimeout = setTimeout(executeSave, 400);
  }
}

/**
 * Records a successful login event in Cloud Firestore for secure audit tracking.
 */
export async function logAuthEventToCloud(user: AuthUser): Promise<void> {
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
          settings,
          stock,
          customers,
          transactions,
          purchases,
          dealers,
          dealerPayments,
          cardMembers,
          cardTransactions,
          staff,
          expenses,
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
            syncDatabaseToCloud(initialFallback, onStatusChange, true);
          }
        } catch (e) {
          console.warn('Fallback read error:', e);
        }
        if (onStatusChange) onStatusChange('connected');
      }
    },
    (error) => {
      console.warn('Firestore subscription error:', error);
      if (onStatusChange) onStatusChange('offline', error.message);
    }
  );

  return unsubscribe;
}

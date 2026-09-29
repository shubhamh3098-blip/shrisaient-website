import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { StoreData } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const CHUNK_SIZE = 250;
const STORE_ID = 'shri_sai_store';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config (CRITICAL as per Firebase Skill)
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Export Auth
export const auth: Auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('[Firebase Firestore Error]:', JSON.stringify(errInfo));
  return errInfo;
}

// Test Connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'stores', STORE_ID, 'meta', 'info'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is limited.');
    }
    return false;
  }
}
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

export interface FirestoreSyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  lastSyncAt: string | null;
  error?: string | null;
}

/**
 * Splits an array into chunks of maximum size chunkSize
 */
function chunkArray<T>(items: T[], chunkSize: number = CHUNK_SIZE): T[][] {
  if (!items || items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Writes documents in bounded parallel batches to avoid both payload limits
 * and browser network socket saturation.
 */
async function writeTasksInBatches(
  tasks: Array<{ ref: any; data: any }>,
  concurrency = 4
): Promise<void> {
  for (let i = 0; i < tasks.length; i += concurrency) {
    const slice = tasks.slice(i, i + concurrency);
    await Promise.all(slice.map((t) => setDoc(t.ref, t.data)));
  }
}

/**
 * Reads documents in bounded batches to avoid socket exhaustion
 */
async function fetchDocsInBatches(refs: any[], concurrency = 8): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < refs.length; i += concurrency) {
    const slice = refs.slice(i, i + concurrency);
    const snaps = await Promise.all(slice.map((r) => getDoc(r)));
    results.push(...snaps);
  }
  return results;
}

let isPushing = false;
let pendingPushData: StoreData | null = null;

/**
 * Saves complete StoreData to Firebase Firestore safely in individual ~100KB chunks.
 * Completely eliminates the 10MB payload size limit error (11534336 bytes).
 */
export async function pushStoreDataToFirestore(data: StoreData): Promise<boolean> {
  if (!data) return false;

  if (isPushing) {
    pendingPushData = data;
    return true;
  }

  isPushing = true;
  try {
    const updatedAt = data.updatedAt || new Date().toISOString();

    const customerChunks = chunkArray(data.customers || []);
    const transactionChunks = chunkArray(data.transactions || []);
    const cardMemberChunks = chunkArray(data.cardMembers || []);
    const cardTransactionChunks = chunkArray(data.cardTransactions || []);
    const billReceiptChunks = chunkArray(data.billReceipts || []);

    const writeTasks: Array<{ ref: any; data: any }> = [];

    customerChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `customers_${idx}`);
      writeTasks.push({ ref, data: { items: chunk, updatedAt } });
    });

    transactionChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `transactions_${idx}`);
      writeTasks.push({ ref, data: { items: chunk, updatedAt } });
    });

    cardMemberChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `cardMembers_${idx}`);
      writeTasks.push({ ref, data: { items: chunk, updatedAt } });
    });

    cardTransactionChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `cardTransactions_${idx}`);
      writeTasks.push({ ref, data: { items: chunk, updatedAt } });
    });

    billReceiptChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `billReceipts_${idx}`);
      writeTasks.push({ ref, data: { items: chunk, updatedAt } });
    });

    // 1. Write all chunk documents in small groups of 4 concurrent setDoc requests
    // Each request payload is only ~70KB to 160KB (well below Firestore's 10MB request limit)
    await writeTasksInBatches(writeTasks, 4);

    // 2. Write metadata document LAST so other clients' onSnapshot triggers only after all chunks exist
    const metaDocRef = doc(db, 'stores', STORE_ID, 'meta', 'info');
    await setDoc(metaDocRef, {
      updatedAt,
      updatedBy: data.updatedBy || 'client',
      settings: data.settings || {},
      stock: data.stock || [],
      staff: data.staff || [],
      dealers: data.dealers || [],
      dealerPayments: data.dealerPayments || [],
      expenses: data.expenses || [],
      agentAdvances: data.agentAdvances || [],
      purchases: data.purchases || [],
      adminUsers: data.adminUsers || [],
      authSessions: data.authSessions || [],
      securitySettings: data.securitySettings || {},
      securityAuditLogs: (data.securityAuditLogs || []).slice(-20),
      isDemoWiped: data.isDemoWiped || false,
      chunkMeta: {
        customers: customerChunks.length,
        transactions: transactionChunks.length,
        cardMembers: cardMemberChunks.length,
        cardTransactions: cardTransactionChunks.length,
        billReceipts: billReceiptChunks.length,
      },
    });

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `stores/${STORE_ID}`);
    return false;
  } finally {
    isPushing = false;
    if (pendingPushData) {
      const nextData = pendingPushData;
      pendingPushData = null;
      pushStoreDataToFirestore(nextData).catch(() => {});
    }
  }
}

/**
 * Pulls complete StoreData from Firebase Firestore
 */
export async function pullStoreDataFromFirestore(): Promise<StoreData | null> {
  try {
    const metaDocRef = doc(db, 'stores', STORE_ID, 'meta', 'info');
    const metaSnap = await getDoc(metaDocRef);

    if (!metaSnap.exists()) {
      return null;
    }

    const meta = metaSnap.data();
    const chunkMeta = meta.chunkMeta || {};

    const loadChunks = async (prefix: string, count: number): Promise<any[]> => {
      if (!count || count <= 0) return [];
      const refs = [];
      for (let i = 0; i < count; i++) {
        refs.push(doc(db, 'stores', STORE_ID, 'data', `${prefix}_${i}`));
      }
      const snaps = await fetchDocsInBatches(refs, 8);
      const allItems: any[] = [];
      for (const s of snaps) {
        if (s.exists()) {
          const d = s.data();
          if (Array.isArray(d.items)) {
            allItems.push(...d.items);
          }
        }
      }
      return allItems;
    };

    const [customers, transactions, cardMembers, cardTransactions, billReceipts] =
      await Promise.all([
        loadChunks('customers', chunkMeta.customers || 0),
        loadChunks('transactions', chunkMeta.transactions || 0),
        loadChunks('cardMembers', chunkMeta.cardMembers || 0),
        loadChunks('cardTransactions', chunkMeta.cardTransactions || 0),
        loadChunks('billReceipts', chunkMeta.billReceipts || 0),
      ]);

    const assembledStoreData: StoreData = {
      updatedAt: meta.updatedAt || new Date().toISOString(),
      updatedBy: meta.updatedBy || 'cloud',
      settings: meta.settings || {},
      stock: meta.stock || [],
      staff: meta.staff || [],
      dealers: meta.dealers || [],
      dealerPayments: meta.dealerPayments || [],
      expenses: meta.expenses || [],
      agentAdvances: meta.agentAdvances || [],
      purchases: meta.purchases || [],
      adminUsers: meta.adminUsers || [],
      authSessions: meta.authSessions || [],
      securitySettings: meta.securitySettings || {},
      securityAuditLogs: meta.securityAuditLogs || [],
      isDemoWiped: meta.isDemoWiped || false,
      customers,
      transactions,
      cardMembers,
      cardTransactions,
      billReceipts,
    };

    return assembledStoreData;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `stores/${STORE_ID}`);
    return null;
  }
}

/**
 * Subscribes to real-time updates from Firebase Firestore
 */
export function subscribeToFirestoreStore(
  onData: (data: StoreData) => void,
  onStatusChange?: (status: FirestoreSyncStatus) => void
): Unsubscribe {
  const metaDocRef = doc(db, 'stores', STORE_ID, 'meta', 'info');

  let isFirstLoad = true;
  let lastKnownUpdatedAt = '';

  const unsubscribe = onSnapshot(
    metaDocRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        if (isFirstLoad) {
          isFirstLoad = false;
        }
        onStatusChange?.({
          isConfigured: true,
          isConnected: true,
          lastSyncAt: null,
        });
        return;
      }

      const meta = snapshot.data();
      const updatedAt = meta.updatedAt || '';

      // Skip if same version
      if (updatedAt && updatedAt === lastKnownUpdatedAt && !isFirstLoad) {
        return;
      }

      lastKnownUpdatedAt = updatedAt;
      isFirstLoad = false;

      // Fetch all chunks
      const data = await pullStoreDataFromFirestore();
      if (data) {
        onData(data);
        onStatusChange?.({
          isConfigured: true,
          isConnected: true,
          lastSyncAt: data.updatedAt,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `stores/${STORE_ID}/meta/info`);
      onStatusChange?.({
        isConfigured: true,
        isConnected: false,
        lastSyncAt: null,
        error: error.message,
      });
    }
  );

  return unsubscribe;
}

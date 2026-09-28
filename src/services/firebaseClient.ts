import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { StoreData } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const CHUNK_SIZE = 500;
const STORE_ID = 'shri_sai_store';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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
 * Saves complete StoreData to Firebase Firestore in chunks
 */
export async function pushStoreDataToFirestore(data: StoreData): Promise<boolean> {
  try {
    const updatedAt = data.updatedAt || new Date().toISOString();

    const customerChunks = chunkArray(data.customers || []);
    const transactionChunks = chunkArray(data.transactions || []);
    const cardMemberChunks = chunkArray(data.cardMembers || []);
    const cardTransactionChunks = chunkArray(data.cardTransactions || []);
    const billReceiptChunks = chunkArray(data.billReceipts || []);

    const metaDocRef = doc(db, 'stores', STORE_ID, 'meta', 'info');

    // Write chunk docs
    const batch = writeBatch(db);

    customerChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `customers_${idx}`);
      batch.set(ref, { items: chunk, updatedAt });
    });

    transactionChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `transactions_${idx}`);
      batch.set(ref, { items: chunk, updatedAt });
    });

    cardMemberChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `cardMembers_${idx}`);
      batch.set(ref, { items: chunk, updatedAt });
    });

    cardTransactionChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `cardTransactions_${idx}`);
      batch.set(ref, { items: chunk, updatedAt });
    });

    billReceiptChunks.forEach((chunk, idx) => {
      const ref = doc(db, 'stores', STORE_ID, 'data', `billReceipts_${idx}`);
      batch.set(ref, { items: chunk, updatedAt });
    });

    // Write meta doc
    batch.set(metaDocRef, {
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

    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firebase Firestore] Failed to push data:', err);
    return false;
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
      const promises: Promise<any>[] = [];
      for (let i = 0; i < count; i++) {
        const ref = doc(db, 'stores', STORE_ID, 'data', `${prefix}_${i}`);
        promises.push(getDoc(ref));
      }
      const snaps = await Promise.all(promises);
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
    console.error('[Firebase Firestore] Failed to pull data:', err);
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
      console.error('[Firebase Firestore] onSnapshot error:', error);
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

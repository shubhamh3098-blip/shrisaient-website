import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDoc,
  serverTimestamp,
  Firestore,
  disableNetwork,
  enableNetwork
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

const MAIN_STORE_DOC_PATH = 'stores/shri_sai_enterprise_main';

export type CloudSyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error';

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

// Quota and circuit-breaker tracking: default to online cloud sync enabled
let isCloudQuotaExhausted = false;
try {
  if (typeof window !== 'undefined') {
    const quotaUntil = localStorage.getItem('firestore_quota_exhausted_until');
    if (quotaUntil && Number(quotaUntil) > Date.now()) {
      isCloudQuotaExhausted = true;
      disableNetwork(firestore).catch(() => {});
    } else {
      isCloudQuotaExhausted = false;
      localStorage.removeItem('firestore_quota_exhausted_until');
      localStorage.setItem('firestore_cloud_enabled', 'true');
      enableNetwork(firestore).catch(() => {});
    }
  }
} catch (e) {}

export function markQuotaExhausted(): void {
  isCloudQuotaExhausted = true;
  try {
    if (typeof window !== 'undefined') {
      const until = Date.now() + 4 * 60 * 60 * 1000; // 4 hours circuit breaker
      localStorage.setItem('firestore_quota_exhausted_until', until.toString());
      localStorage.removeItem('firestore_cloud_enabled');
      sessionStorage.setItem('firestore_quota_exhausted', 'true');
    }
  } catch (e) {}
  try {
    disableNetwork(firestore).catch(() => {});
  } catch (e) {}
}

export function isFirestoreQuotaExhausted(): boolean {
  return isCloudQuotaExhausted;
}

export async function resetFirestoreQuotaFlag(): Promise<void> {
  isCloudQuotaExhausted = false;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('firestore_quota_exhausted');
      localStorage.removeItem('firestore_quota_exhausted_until');
      localStorage.setItem('firestore_cloud_enabled', 'true');
    }
  } catch (e) {}
  try {
    await enableNetwork(firestore);
  } catch (e) {}
}

/**
 * Saves current database snapshot to Cloud Firestore.
 * Supports debounced (default 2500ms) or immediate save.
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingDataToSave: AppDatabase | null = null;

export async function syncDatabaseToCloud(
  database: AppDatabase, 
  onStatusChange?: (status: CloudSyncStatus, error?: string) => void,
  immediate: boolean = false
): Promise<void> {
  // If Firestore daily write limit is reached, safely bypass cloud write to avoid errors
  if (isCloudQuotaExhausted) {
    if (onStatusChange) onStatusChange('offline', 'Daily Cloud write limit reached. Safely saved in Local Storage.');
    return;
  }

  pendingDataToSave = database;
  if (onStatusChange) onStatusChange('syncing');

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  const executeSave = async () => {
    if (!pendingDataToSave || isCloudQuotaExhausted) return;
    const data = pendingDataToSave;
    pendingDataToSave = null;

    try {
      const storeRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
      const payload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
        serverTime: serverTimestamp(),
        domain: 'shrisaient.in',
        settings: sanitizeForFirestore(data.settings),
        stock: sanitizeForFirestore(data.stock),
        dealers: sanitizeForFirestore(data.dealers),
        dealerPayments: sanitizeForFirestore(data.dealerPayments),
        purchases: sanitizeForFirestore(data.purchases),
        staff: sanitizeForFirestore(data.staff),
        expenses: sanitizeForFirestore(data.expenses),
        agentAdvances: sanitizeForFirestore(data.agentAdvances || []),
      };

      // Also include in main doc if compact (< 150 items) for backward compatibility
      if (data.customers && data.customers.length <= 150) {
        payload.customers = sanitizeForFirestore(data.customers);
      }
      if (data.transactions && data.transactions.length <= 150) {
        payload.transactions = sanitizeForFirestore(data.transactions);
      }
      if (data.cardMembers && data.cardMembers.length <= 150) {
        payload.cardMembers = sanitizeForFirestore(data.cardMembers);
      }
      if (data.cardTransactions && data.cardTransactions.length <= 150) {
        payload.cardTransactions = sanitizeForFirestore(data.cardTransactions);
      }
      if (data.billReceipts && data.billReceipts.length <= 150) {
        payload.billReceipts = sanitizeForFirestore(data.billReceipts);
      }

      const savePromises: Promise<any>[] = [
        setDoc(storeRef, payload, { merge: true }),
      ];

      // Partition large collections into dedicated documents to completely avoid 1MB limits
      if (data.cardTransactions && data.cardTransactions.length > 0) {
        savePromises.push(
          setDoc(
            doc(firestore, 'stores', 'data_card_transactions'),
            { items: sanitizeForFirestore(data.cardTransactions), updatedAt: new Date().toISOString() },
            { merge: true }
          )
        );
      }

      if (data.transactions && data.transactions.length > 0) {
        savePromises.push(
          setDoc(
            doc(firestore, 'stores', 'data_transactions'),
            { items: sanitizeForFirestore(data.transactions), updatedAt: new Date().toISOString() },
            { merge: true }
          )
        );
      }

      if (data.cardMembers && data.cardMembers.length > 0) {
        savePromises.push(
          setDoc(
            doc(firestore, 'stores', 'data_card_members'),
            { items: sanitizeForFirestore(data.cardMembers), updatedAt: new Date().toISOString() },
            { merge: true }
          )
        );
      }

      if (data.customers && data.customers.length > 0) {
        savePromises.push(
          setDoc(
            doc(firestore, 'stores', 'data_customers'),
            { items: sanitizeForFirestore(data.customers), updatedAt: new Date().toISOString() },
            { merge: true }
          )
        );
      }

      if (data.billReceipts && data.billReceipts.length > 0) {
        savePromises.push(
          setDoc(
            doc(firestore, 'stores', 'data_bill_receipts'),
            { items: sanitizeForFirestore(data.billReceipts), updatedAt: new Date().toISOString() },
            { merge: true }
          )
        );
      }

      await Promise.allSettled(savePromises);
      if (onStatusChange) onStatusChange('connected');
    } catch (err: any) {
      const isQuota = 
        err?.code === 'resource-exhausted' || 
        err?.message?.includes('Quota') || 
        err?.message?.includes('resource-exhausted') ||
        err?.message?.includes('limit');

      if (isQuota) {
        markQuotaExhausted();
        console.warn('Firestore daily write quota reached. Switching to local offline mode.');
        if (onStatusChange) onStatusChange('offline', 'Daily Cloud quota reached. All data safely saved locally.');
        return;
      }

      console.warn('Cloud sync notice (safely stored locally):', err?.message || err);
      if (onStatusChange) onStatusChange('offline', err?.message || 'Sync offline');
    }
  };

  if (immediate) {
    await executeSave();
  } else {
    // 2500ms debounce to prevent excessive writes on every stroke
    saveTimeout = setTimeout(executeSave, 600);
  }
}

/**
 * Records a successful login event in Cloud Firestore for secure audit tracking.
 */
export async function logAuthEventToCloud(user: AuthUser): Promise<void> {
  if (isCloudQuotaExhausted) return;
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
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota')) {
      markQuotaExhausted();
    }
    console.warn('Login audit notice:', err?.message || err);
  }
}

/**
 * Listens in REAL TIME to changes in Cloud Firestore.
 * When a bill, card entry, or customer is added on mobile or another PC,
 * this callback will immediately update the local state.
 */
export function subscribeToCloudDatabase(
  onDataReceived: (remoteData: AppDatabase) => void,
  onStatusChange?: (status: CloudSyncStatus, error?: string) => void,
  initialFallback?: AppDatabase
): () => void {
  if (isCloudQuotaExhausted) {
    if (onStatusChange) onStatusChange('offline', 'Operating in Local Storage mode.');
    return () => {};
  }

  if (onStatusChange) onStatusChange('syncing');

  const storeRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
  const cardTxRef = doc(firestore, 'stores', 'data_card_transactions');
  const txRef = doc(firestore, 'stores', 'data_transactions');
  const membersRef = doc(firestore, 'stores', 'data_card_members');
  const custRef = doc(firestore, 'stores', 'data_customers');
  const rcpRef = doc(firestore, 'stores', 'data_bill_receipts');

  const currentCloudData: AppDatabase = {
    settings: undefined,
    stock: [],
    customers: [],
    transactions: [],
    purchases: [],
    dealers: [],
    dealerPayments: [],
    cardMembers: [],
    cardTransactions: [],
    staff: [],
    expenses: [],
    agentAdvances: [],
    billReceipts: [],
  };

  const unsubs: (() => void)[] = [];

  const notify = () => {
    onDataReceived({ ...currentCloudData });
    if (onStatusChange) onStatusChange('connected');
  };

  try {
    const u1 = onSnapshot(
      storeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          if (docData) {
            currentCloudData.settings = docData.settings || currentCloudData.settings;
            currentCloudData.stock = docData.stock || currentCloudData.stock;
            currentCloudData.purchases = docData.purchases || currentCloudData.purchases;
            currentCloudData.dealers = docData.dealers || currentCloudData.dealers;
            currentCloudData.dealerPayments = docData.dealerPayments || currentCloudData.dealerPayments;
            currentCloudData.staff = docData.staff || currentCloudData.staff;
            currentCloudData.expenses = docData.expenses || currentCloudData.expenses;
            currentCloudData.agentAdvances = docData.agentAdvances || currentCloudData.agentAdvances;

            if ((!currentCloudData.cardTransactions || currentCloudData.cardTransactions.length === 0) && docData.cardTransactions) {
              currentCloudData.cardTransactions = docData.cardTransactions;
            }
            if ((!currentCloudData.transactions || currentCloudData.transactions.length === 0) && docData.transactions) {
              currentCloudData.transactions = docData.transactions;
            }
            if ((!currentCloudData.customers || currentCloudData.customers.length === 0) && docData.customers) {
              currentCloudData.customers = docData.customers;
            }
            if ((!currentCloudData.cardMembers || currentCloudData.cardMembers.length === 0) && docData.cardMembers) {
              currentCloudData.cardMembers = docData.cardMembers;
            }
            if ((!currentCloudData.billReceipts || currentCloudData.billReceipts.length === 0) && docData.billReceipts) {
              currentCloudData.billReceipts = docData.billReceipts;
            }
            notify();
          }
        } else {
          if (onStatusChange) onStatusChange('connected');
          if (initialFallback && !isCloudQuotaExhausted) {
            syncDatabaseToCloud(initialFallback, onStatusChange, true);
          }
        }
      },
      (error) => {
        const isQuota = 
          error?.code === 'resource-exhausted' || 
          error?.message?.includes('Quota') || 
          error?.message?.includes('resource-exhausted');

        if (isQuota) {
          markQuotaExhausted();
          if (onStatusChange) onStatusChange('offline', 'Operating in safe Local Storage mode.');
        } else {
          console.warn('Firestore subscription notice:', error.message);
          if (onStatusChange) onStatusChange('offline', error.message);
        }
      }
    );
    unsubs.push(u1);

    const u2 = onSnapshot(cardTxRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.cardTransactions = d.items;
          notify();
        }
      }
    });
    unsubs.push(u2);

    const u3 = onSnapshot(txRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.transactions = d.items;
          notify();
        }
      }
    });
    unsubs.push(u3);

    const u4 = onSnapshot(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.cardMembers = d.items;
          notify();
        }
      }
    });
    unsubs.push(u4);

    const u5 = onSnapshot(custRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.customers = d.items;
          notify();
        }
      }
    });
    unsubs.push(u5);

    const u6 = onSnapshot(rcpRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.billReceipts = d.items;
          notify();
        }
      }
    });
    unsubs.push(u6);

  } catch (err: any) {
    console.warn('Firestore listener notice:', err);
    if (onStatusChange) onStatusChange('offline', err?.message || 'Offline mode');
  }

  return () => {
    unsubs.forEach((u) => {
      try {
        u();
      } catch (_) {}
    });
  };
}

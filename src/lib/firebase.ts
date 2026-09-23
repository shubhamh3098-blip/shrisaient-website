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
  enableNetwork,
  setLogLevel
} from 'firebase/firestore';
import type { AppDatabase } from '../utils/storage';
import type { AuthUser } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence internal Firestore SDK logs (suppresses "Using maximum backoff delay" and quota messages)
try {
  setLogLevel('silent');
} catch (e) {}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific database configured for this project
export const firestore: Firestore = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId || '(default)'
);

const MAIN_STORE_DOC_PATH = 'stores/shri_sai_enterprise_main';

export type CloudSyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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

// Test connection on boot as recommended by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const ref = doc(firestore, 'stores', 'shri_sai_enterprise_main');
    await getDoc(ref);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently operating in offline mode.');
    }
    return false;
  }
}

// Quota and circuit-breaker tracking: cloud sync is enabled by default for real-time mobile sync
let isCloudQuotaExhausted = false;

try {
  if (typeof window !== 'undefined') {
    const exhaustedDate = localStorage.getItem('firestore_quota_exhausted_date');
    const today = new Date().toISOString().slice(0, 10);
    // If it's a new day or clean session, reset quota state so sync is active
    if (exhaustedDate && exhaustedDate !== today) {
      localStorage.removeItem('firestore_quota_exhausted_date');
      sessionStorage.removeItem('firestore_quota_exhausted');
    } else if (sessionStorage.getItem('firestore_quota_exhausted') === 'true' && exhaustedDate === today) {
      isCloudQuotaExhausted = true;
    }

    // Intercept unhandled Firestore quota errors globally to suppress console crashes
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event?.reason;
      const msg = String(reason?.message || reason || '');
      if (
        reason?.code === 'resource-exhausted' ||
        msg.includes('resource-exhausted') ||
        msg.includes('Quota limit exceeded') ||
        msg.includes('Free daily write units')
      ) {
        markQuotaExhausted();
        event.preventDefault();
      }
    });
  }
} catch (e) {}

export function markQuotaExhausted(): void {
  if (isCloudQuotaExhausted) return;
  isCloudQuotaExhausted = true;
  try {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('firestore_quota_exhausted_date', today);
      sessionStorage.setItem('firestore_quota_exhausted', 'true');
    }
  } catch (e) {}
  try {
    // Halts background write retry loop to suppress "Using maximum backoff delay"
    disableNetwork(firestore).catch(() => {});
  } catch (e) {}
}

export function isFirestoreQuotaExhausted(): boolean {
  return isCloudQuotaExhausted;
}

export async function resetFirestoreQuotaFlag(): Promise<boolean> {
  isCloudQuotaExhausted = false;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('firestore_quota_exhausted');
      localStorage.removeItem('firestore_quota_exhausted_until');
      localStorage.removeItem('firestore_quota_exhausted_date');
      localStorage.setItem('firestore_cloud_enabled', 'true');
    }
  } catch (e) {}
  try {
    await enableNetwork(firestore);
    return true;
  } catch (e) {
    return false;
  }
}

// Fingerprint helpers to ONLY write partitions that have actually changed
const lastSavedPartitionHashes = new Map<string, string>();

function getCollectionFingerprint(arr: any[] | undefined): string {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '0:empty';
  const len = arr.length;
  const first = arr[0]?.id || arr[0]?.invoiceNo || arr[0]?.receiptNo || '';
  const last = arr[len - 1]?.id || arr[len - 1]?.invoiceNo || arr[len - 1]?.receiptNo || '';
  return `${len}:${first}:${last}`;
}

// Safe setDoc with timeout to prevent queued writes from hanging indefinitely in memory
function setDocWithTimeout(docRef: any, data: any, options: any, timeoutMs = 10000): Promise<void> {
  if (isCloudQuotaExhausted) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(); // Don't crash on timeout, continue locally
      }
    }, timeoutMs);

    setDoc(docRef, data, options)
      .then(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve();
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          const isQuota =
            err?.code === 'resource-exhausted' ||
            err?.message?.includes('resource-exhausted') ||
            err?.message?.includes('maximum allowed queued writes') ||
            err?.message?.includes('Quota') ||
            err?.message?.includes('quota');
          if (isQuota) {
            markQuotaExhausted();
            resolve();
            return;
          }
          reject(err);
        }
      });
  });
}

/**
 * Saves current database snapshot to Cloud Firestore.
 * Supports debounced or immediate save with in-flight locking and partition diffing.
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingDataToSave: AppDatabase | null = null;
let isSaveInProgress = false;

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
    saveTimeout = null;
  }

  const executeSave = async () => {
    if (!pendingDataToSave || isCloudQuotaExhausted) return;
    if (isSaveInProgress) {
      // In-flight save active; leave pendingDataToSave populated so it runs immediately after
      return;
    }

    if (immediate) {
      lastSavedPartitionHashes.clear();
    }

    const data = pendingDataToSave;
    pendingDataToSave = null;
    isSaveInProgress = true;

    try {
      const storeRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');
      const saveTasks: (() => Promise<void>)[] = [];

      // Check partition fingerprints to ONLY write collections that actually changed
      const ctHash = getCollectionFingerprint(data.cardTransactions);
      if (Array.isArray(data.cardTransactions) && ctHash !== lastSavedPartitionHashes.get('cardTransactions')) {
        saveTasks.push(async () => {
          await setDocWithTimeout(
            doc(firestore, 'stores', 'data_card_transactions'),
            { items: sanitizeForFirestore(data.cardTransactions), updatedAt: new Date().toISOString() },
            { merge: true }
          );
          lastSavedPartitionHashes.set('cardTransactions', ctHash);
        });
      }

      const txHash = getCollectionFingerprint(data.transactions);
      if (Array.isArray(data.transactions) && txHash !== lastSavedPartitionHashes.get('transactions')) {
        saveTasks.push(async () => {
          await setDocWithTimeout(
            doc(firestore, 'stores', 'data_transactions'),
            { items: sanitizeForFirestore(data.transactions), updatedAt: new Date().toISOString() },
            { merge: true }
          );
          lastSavedPartitionHashes.set('transactions', txHash);
        });
      }

      const cmHash = getCollectionFingerprint(data.cardMembers);
      if (Array.isArray(data.cardMembers) && cmHash !== lastSavedPartitionHashes.get('cardMembers')) {
        saveTasks.push(async () => {
          await setDocWithTimeout(
            doc(firestore, 'stores', 'data_card_members'),
            { items: sanitizeForFirestore(data.cardMembers), updatedAt: new Date().toISOString() },
            { merge: true }
          );
          lastSavedPartitionHashes.set('cardMembers', cmHash);
        });
      }

      const cHash = getCollectionFingerprint(data.customers);
      if (Array.isArray(data.customers) && cHash !== lastSavedPartitionHashes.get('customers')) {
        saveTasks.push(async () => {
          await setDocWithTimeout(
            doc(firestore, 'stores', 'data_customers'),
            { items: sanitizeForFirestore(data.customers), updatedAt: new Date().toISOString() },
            { merge: true }
          );
          lastSavedPartitionHashes.set('customers', cHash);
        });
      }

      const brHash = getCollectionFingerprint(data.billReceipts);
      if (Array.isArray(data.billReceipts) && brHash !== lastSavedPartitionHashes.get('billReceipts')) {
        saveTasks.push(async () => {
          await setDocWithTimeout(
            doc(firestore, 'stores', 'data_bill_receipts'),
            { items: sanitizeForFirestore(data.billReceipts), updatedAt: new Date().toISOString() },
            { merge: true }
          );
          lastSavedPartitionHashes.set('billReceipts', brHash);
        });
      }

      // Check main document entities
      const mainHash = `${data.stock?.length || 0}_${data.dealers?.length || 0}_${data.expenses?.length || 0}_${data.purchases?.length || 0}_${data.agentAdvances?.length || 0}_${data.dealerPayments?.length || 0}_${data.staff?.length || 0}`;
      if (mainHash !== lastSavedPartitionHashes.get('mainStore')) {
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
          mergedRecords: sanitizeForFirestore(data.mergedRecords || []),
        };

        saveTasks.push(async () => {
          await setDocWithTimeout(storeRef, payload, { merge: true });
          lastSavedPartitionHashes.set('mainStore', mainHash);
        });
      }

      if (saveTasks.length === 0) {
        // Nothing changed! Safely complete
        if (onStatusChange) onStatusChange('connected');
        isSaveInProgress = false;
        return;
      }

      let hasNetworkOrUnavailableError = false;
      // Execute sequentially with pacing to avoid write-stream saturation
      for (const task of saveTasks) {
        if (isCloudQuotaExhausted) break;
        try {
          await task();
          await new Promise((resolve) => setTimeout(resolve, 60));
        } catch (err: any) {
          if (
            err?.code === 'resource-exhausted' ||
            err?.message?.includes('resource-exhausted') ||
            err?.message?.includes('maximum allowed queued writes') ||
            err?.message?.includes('Quota')
          ) {
            markQuotaExhausted();
            if (onStatusChange) onStatusChange('offline', 'Cloud limit reached. All data safely saved locally.');
            return;
          }
          const isUnavailable =
            err?.code === 'unavailable' ||
            err?.message?.includes('unavailable') ||
            err?.message?.includes('timeout') ||
            err?.message?.includes('network');
          if (isUnavailable) {
            hasNetworkOrUnavailableError = true;
            console.warn('Cloud network unavailable. Safely stored locally in IndexedDB & LocalStorage.');
            if (onStatusChange) onStatusChange('offline', 'स्थानिक ऑफलाइन मोड सक्रिय (डेटा स्थानिकरित्या सुरक्षित आहे)');
            break;
          }
          console.warn('Individual cloud partition notice (safely stored locally):', err?.message || err);
        }
      }

      if (!hasNetworkOrUnavailableError && onStatusChange) {
        onStatusChange('connected');
      }
    } catch (err: any) {
      const isQuota = 
        err?.code === 'resource-exhausted' || 
        err?.message?.includes('Quota') || 
        err?.message?.includes('resource-exhausted') ||
        err?.message?.includes('maximum allowed queued writes') ||
        err?.message?.includes('limit');

      if (isQuota) {
        markQuotaExhausted();
        console.warn('Firestore write quota reached. Switching to local offline mode.');
        if (onStatusChange) onStatusChange('offline', 'Daily Cloud quota reached. All data safely saved locally.');
        return;
      }

      console.warn('Cloud sync notice (safely stored locally):', err?.message || err);
      if (onStatusChange) onStatusChange('offline', err?.message || 'Sync offline');
    } finally {
      isSaveInProgress = false;
      // If new data arrived while we were saving, trigger next save
      if (pendingDataToSave && !isCloudQuotaExhausted) {
        saveTimeout = setTimeout(executeSave, 4500);
      }
    }
  };

  if (immediate) {
    await executeSave();
  } else {
    // 4500ms debounce to prevent excessive writes
    saveTimeout = setTimeout(executeSave, 4500);
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
    await setDocWithTimeout(
      storeRef,
      {
        lastLogin: loginRecord,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
      5000
    );
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('maximum allowed queued writes')) {
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
  let notifyTimer: ReturnType<typeof setTimeout> | null = null;

  // Debounce notification so that on initial load, all 6 documents merge cleanly into a single update
  const debouncedNotify = () => {
    if (notifyTimer) clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => {
      // Record fingerprints so local state does not trigger an echo upload of remote data
      lastSavedPartitionHashes.set('cardTransactions', getCollectionFingerprint(currentCloudData.cardTransactions));
      lastSavedPartitionHashes.set('transactions', getCollectionFingerprint(currentCloudData.transactions));
      lastSavedPartitionHashes.set('cardMembers', getCollectionFingerprint(currentCloudData.cardMembers));
      lastSavedPartitionHashes.set('customers', getCollectionFingerprint(currentCloudData.customers));
      lastSavedPartitionHashes.set('billReceipts', getCollectionFingerprint(currentCloudData.billReceipts));

      const mainHash = `${currentCloudData.stock?.length || 0}_${currentCloudData.dealers?.length || 0}_${currentCloudData.expenses?.length || 0}_${currentCloudData.purchases?.length || 0}_${currentCloudData.agentAdvances?.length || 0}_${currentCloudData.dealerPayments?.length || 0}_${currentCloudData.staff?.length || 0}`;
      lastSavedPartitionHashes.set('mainStore', mainHash);

      onDataReceived({ ...currentCloudData });
      if (onStatusChange) onStatusChange('connected');
    }, 120);
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
            currentCloudData.mergedRecords = docData.mergedRecords || currentCloudData.mergedRecords || [];

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
            debouncedNotify();
          }
        } else {
          if (onStatusChange) onStatusChange('connected');
        }
      },
      (error) => {
        const isQuota = 
          error?.code === 'resource-exhausted' || 
          error?.message?.includes('Quota') || 
          error?.message?.includes('resource-exhausted') ||
          error?.message?.includes('maximum allowed queued writes');

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

    const handleSubDocError = (error: any, docName: string) => {
      const isQuota = 
        error?.code === 'resource-exhausted' || 
        error?.message?.includes('Quota') || 
        error?.message?.includes('resource-exhausted') ||
        error?.message?.includes('maximum allowed queued writes');

      if (isQuota) {
        markQuotaExhausted();
        if (onStatusChange) onStatusChange('offline', 'Operating in safe Local Storage mode.');
      } else {
        console.warn(`Firestore collection ${docName} subscription notice:`, error?.message || error);
      }
    };

    const u2 = onSnapshot(cardTxRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.cardTransactions = d.items;
          debouncedNotify();
        }
      }
    }, (err) => handleSubDocError(err, 'cardTransactions'));
    unsubs.push(u2);

    const u3 = onSnapshot(txRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.transactions = d.items;
          debouncedNotify();
        }
      }
    }, (err) => handleSubDocError(err, 'transactions'));
    unsubs.push(u3);

    const u4 = onSnapshot(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.cardMembers = d.items;
          debouncedNotify();
        }
      }
    }, (err) => handleSubDocError(err, 'cardMembers'));
    unsubs.push(u4);

    const u5 = onSnapshot(custRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.customers = d.items;
          debouncedNotify();
        }
      }
    }, (err) => handleSubDocError(err, 'customers'));
    unsubs.push(u5);

    const u6 = onSnapshot(rcpRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        if (d && Array.isArray(d.items)) {
          currentCloudData.billReceipts = d.items;
          debouncedNotify();
        }
      }
    }, (err) => handleSubDocError(err, 'billReceipts'));
    unsubs.push(u6);

  } catch (err: any) {
    console.warn('Firestore listener notice:', err);
    if (onStatusChange) onStatusChange('offline', err?.message || 'Offline mode');
  }

  return () => {
    if (notifyTimer) clearTimeout(notifyTimer);
    unsubs.forEach((u) => {
      try {
        u();
      } catch (_) {}
    });
  };
}

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
      const payload = {
        updatedAt: new Date().toISOString(),
        serverTime: serverTimestamp(),
        domain: 'shrisaient.in',
        settings: sanitizeForFirestore(data.settings),
        stock: sanitizeForFirestore(data.stock),
        customers: sanitizeForFirestore(data.customers),
        transactions: sanitizeForFirestore(data.transactions),
        purchases: sanitizeForFirestore(data.purchases),
        dealers: sanitizeForFirestore(data.dealers),
        dealerPayments: sanitizeForFirestore(data.dealerPayments),
        cardMembers: sanitizeForFirestore(data.cardMembers),
        cardTransactions: sanitizeForFirestore(data.cardTransactions),
        staff: sanitizeForFirestore(data.staff),
        expenses: sanitizeForFirestore(data.expenses),
        agentAdvances: sanitizeForFirestore(data.agentAdvances || []),
        billReceipts: sanitizeForFirestore(data.billReceipts || []),
      };

      await setDoc(storeRef, payload, { merge: true });
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

  let unsubscribe = () => {};

  try {
    unsubscribe = onSnapshot(
      storeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          if (docData) {
            const parsedData: AppDatabase = {
              settings: docData.settings || undefined,
              stock: docData.stock || [],
              customers: docData.customers || [],
              transactions: docData.transactions || [],
              purchases: docData.purchases || [],
              dealers: docData.dealers || [],
              dealerPayments: docData.dealerPayments || [],
              cardMembers: docData.cardMembers || [],
              cardTransactions: docData.cardTransactions || [],
              staff: docData.staff || [],
              expenses: docData.expenses || [],
              agentAdvances: docData.agentAdvances || [],
              billReceipts: docData.billReceipts || [],
            };
            onDataReceived(parsedData);
            if (onStatusChange) onStatusChange('connected');
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
          try {
            unsubscribe();
          } catch (e) {}
          markQuotaExhausted();
          console.warn('Firestore: Daily write quota reached. Switched to safe Local Storage.');
          if (onStatusChange) onStatusChange('offline', 'Operating in safe Local Storage mode.');
        } else {
          console.warn('Firestore subscription notice:', error.message);
          if (onStatusChange) onStatusChange('offline', error.message);
        }
      }
    );
  } catch (err: any) {
    console.warn('Firestore listener notice:', err);
    if (onStatusChange) onStatusChange('offline', err?.message || 'Offline mode');
  }

  return unsubscribe;
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDoc,
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

/**
 * Saves current database snapshot to Cloud Firestore.
 * Supports debounced (default 500ms) or immediate save.
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingDataToSave: AppDatabase | null = null;

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
    if (!pendingDataToSave) return;
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
      };

      await setDoc(storeRef, payload, { merge: true });
      if (onStatusChange) onStatusChange('connected');
    } catch (err: any) {
      console.warn('Cloud sync error (fallback to local):', err);
      if (onStatusChange) onStatusChange('error', err?.message || 'Sync failed');
    }
  };

  if (immediate) {
    await executeSave();
  } else {
    saveTimeout = setTimeout(executeSave, 500);
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
 * Listens in REAL TIME to changes in Cloud Firestore.
 * When a bill, card entry, or customer is added on mobile or another PC,
 * this callback will immediately update the local state.
 */
export function subscribeToCloudDatabase(
  onDataReceived: (remoteData: AppDatabase) => void,
  onStatusChange?: (status: CloudSyncStatus, error?: string) => void,
  initialFallback?: AppDatabase
): () => void {
  if (onStatusChange) onStatusChange('syncing');

  const storeRef = doc(firestore, 'stores', 'shri_sai_enterprise_main');

  // Check initial existence and listen to real-time updates
  const unsubscribe = onSnapshot(
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
          };
          onDataReceived(parsedData);
          if (onStatusChange) onStatusChange('connected');
        }
      } else {
        // Document does not exist in Firestore yet (first time initialization)
        if (onStatusChange) onStatusChange('connected');
        if (initialFallback) {
          syncDatabaseToCloud(initialFallback, onStatusChange, true);
        }
      }
    },
    (error) => {
      console.warn('Firestore subscription error:', error);
      if (onStatusChange) onStatusChange('offline', error.message);
    }
  );

  return unsubscribe;
}

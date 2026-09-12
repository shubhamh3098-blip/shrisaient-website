/**
 * IndexedDB Persistence Layer for Shri Sai Enterprises
 * Provides robust, unlimited client-side storage for thousands of imported customers,
 * transactions, card schemes, and bills without hitting browser localStorage 5MB quota.
 */
import type { AppDatabase } from './storage';

const DB_NAME = 'ShriSaiEnterprisesDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'main_database';

let dbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

/**
 * Saves the entire application database asynchronously to IndexedDB.
 */
export async function saveDatabaseToIndexedDB(db: AppDatabase): Promise<void> {
  try {
    const idb = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(db, STATE_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save database to IndexedDB:', err);
  }
}

/**
 * Loads the application database from IndexedDB.
 */
export async function loadDatabaseFromIndexedDB(): Promise<AppDatabase | null> {
  try {
    const idb = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to load database from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears stored database from IndexedDB.
 */
export async function clearDatabaseFromIndexedDB(): Promise<void> {
  try {
    const idb = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STATE_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB:', err);
  }
}

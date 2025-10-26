// A simple promise-based wrapper for IndexedDB
const DB_NAME = 'AlfanumrikDB';
const STORES = ['cache', 'fineTuningData'];
const DB_VERSION = 2; // Bump version to add new object store

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // Create object stores if they don't exist
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          if (storeName === 'fineTuningData') {
            db.createObjectStore(storeName, { keyPath: 'id' });
          } else {
            db.createObjectStore(storeName);
          }
        }
      });
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
  });
  return dbPromise;
};

export const get = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result as T | undefined);
        };
        request.onerror = () => {
            console.error('IndexedDB get error:', request.error);
            reject(request.error);
        };
    });
};

export const set = async (storeName: string, key: IDBValidKey, value: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error('IndexedDB set error:', request.error);
            reject(request.error);
        };
    });
};

export const add = async (storeName: string, value: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(value);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error('IndexedDB add error:', request.error);
            reject(request.error);
        };
    });
};

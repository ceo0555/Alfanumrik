export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class MemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const isStorageAccessible = (storage: Storage | undefined | null): storage is Storage => {
  if (!storage) return false;
  try {
    const testKey = '__alfanumrik_storage_probe__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const resolveBrowserStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && isStorageAccessible(window.localStorage)) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined') {
    const globalStorage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (isStorageAccessible(globalStorage ?? null)) {
      return globalStorage ?? null;
    }
  }

  return null;
};

let memoryStorage: MemoryStorage | null = null;

export const getStorage = (): StorageAdapter => {
  const storage = resolveBrowserStorage();
  if (storage) {
    return storage;
  }

  if (!memoryStorage) {
    memoryStorage = new MemoryStorage();
  }
  return memoryStorage;
};

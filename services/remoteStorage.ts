type BootstrapPayload = Record<string, unknown>;

const API_BASE = '/api';

const toJsonString = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const parseStringValue = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

class RemoteStorage {
  private cache = new Map<string, string>();
  private hydrated = false;
  private flushPromise: Promise<void> | null = null;
  private flushScheduled = false;
  private pendingWrites = new Map<string, unknown>();
  private pendingDeletes = new Set<string>();

  private async hydrate(): Promise<void> {
    if (this.hydrated) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bootstrap`);
      if (!response.ok) {
        console.error('Failed to hydrate remote storage', response.statusText);
        this.cache.clear();
        return;
      }

      const payload = (await response.json()) as { data?: BootstrapPayload };
      const entries = Object.entries(payload?.data ?? {});
      this.cache.clear();
      for (const [key, value] of entries) {
        if (value === undefined) {
          continue;
        }
        this.cache.set(key, toJsonString(value));
      }
    } catch (error) {
      console.error('Hydration error', error);
    } finally {
      this.hydrated = true;
    }
  }

  private scheduleFlush() {
    if (this.flushScheduled) {
      return;
    }
    this.flushScheduled = true;
    Promise.resolve()
      .then(() => this.flush())
      .catch((error) => {
        console.error('Scheduled flush failed', error);
      });
  }

  private async persistWrites(writes: [string, unknown][]) {
    if (!writes.length) {
      return;
    }
    await Promise.all(
      writes.map(([key, value]) =>
        fetch(`${API_BASE}/resources/${encodeURIComponent(key)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: value ?? null }),
        }).catch((error) => {
          console.error(`Persisting resource "${key}" failed`, error);
        })
      )
    );
  }

  private async persistDeletes(deletes: string[]) {
    if (!deletes.length) {
      return;
    }
    await Promise.all(
      deletes.map((key) =>
        fetch(`${API_BASE}/resources/${encodeURIComponent(key)}`, {
          method: 'DELETE',
        }).catch((error) => {
          console.error(`Deleting resource "${key}" failed`, error);
        })
      )
    );
  }

  private async flush(): Promise<void> {
    this.flushScheduled = false;
    if (!this.hydrated) {
      await this.hydrate();
    }
    if (this.pendingWrites.size === 0 && this.pendingDeletes.size === 0) {
      return;
    }

    const writes = Array.from(this.pendingWrites.entries());
    const deletes = Array.from(this.pendingDeletes);
    this.pendingWrites.clear();
    this.pendingDeletes.clear();

    this.flushPromise = Promise.all([
      this.persistWrites(writes),
      this.persistDeletes(deletes),
    ]).then(() => undefined);

    try {
      await this.flushPromise;
    } finally {
      this.flushPromise = null;
    }
  }

  async ensureHydrated() {
    await this.hydrate();
  }

  getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.cache.set(key, value);
    this.pendingWrites.set(key, parseStringValue(value));
    this.pendingDeletes.delete(key);
    this.scheduleFlush();
  }

  removeItem(key: string) {
    this.cache.delete(key);
    this.pendingWrites.delete(key);
    this.pendingDeletes.add(key);
    this.scheduleFlush();
  }

  clear() {
    const keys = Array.from(this.cache.keys());
    this.cache.clear();
    this.pendingWrites.clear();
    for (const key of keys) {
      this.pendingDeletes.add(key);
    }
    this.scheduleFlush();
  }

  async flushImmediate() {
    if (this.flushPromise) {
      await this.flushPromise;
      return;
    }
    if (this.pendingWrites.size === 0 && this.pendingDeletes.size === 0) {
      return;
    }
    await this.flush();
  }
}

export const remoteStorage = new RemoteStorage();

export default remoteStorage;

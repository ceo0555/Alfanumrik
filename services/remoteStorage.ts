type StateSnapshot = Record<string, string>;

class RemoteStorage {
  private cache: Map<string, string> = new Map();
  private hydrated = false;
  private flushPromise: Promise<void> | null = null;
  private flushScheduled = false;
  private dirty = false;

  private async hydrate(): Promise<void> {
    if (this.hydrated) return;
    try {
      const response = await fetch('/api/app-state');
      if (response.ok) {
        const data = await response.json();
        const state = (data?.state ?? {}) as StateSnapshot;
        this.cache = new Map(Object.entries(state));
      } else if (response.status === 404) {
        this.cache = new Map();
      } else {
        console.error('Failed to hydrate remote storage', response.statusText);
      }
    } catch (error) {
      console.error('Hydration error', error);
    } finally {
      this.hydrated = true;
    }
  }

  private scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    Promise.resolve()
      .then(() => this.flush())
      .catch((error) => {
        console.error('Scheduled flush failed', error);
      });
  }

  private async flush(): Promise<void> {
    this.flushScheduled = false;
    if (!this.dirty) {
      return;
    }
    if (!this.hydrated) {
      await this.hydrate();
    }
    const payload: StateSnapshot = Object.fromEntries(this.cache.entries());
    this.flushPromise = fetch('/api/app-state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: payload }),
    }).then(() => undefined, (error) => {
      console.error('Persisting app state failed', error);
    });
    try {
      await this.flushPromise;
      this.dirty = false;
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
    if (!this.hydrated) {
      console.warn(`Remote storage not hydrated yet. Setting key "${key}" will overwrite defaults.`);
    }
    this.cache.set(key, value);
    this.dirty = true;
    this.scheduleFlush();
  }

  removeItem(key: string) {
    this.cache.delete(key);
    this.dirty = true;
    this.scheduleFlush();
  }

  clear() {
    this.cache.clear();
    this.dirty = true;
    this.scheduleFlush();
  }

  async flushImmediate() {
    if (this.flushPromise) {
      await this.flushPromise;
      return;
    }
    if (!this.dirty) {
      return;
    }
    await this.flush();
  }

  setInitialState(state: StateSnapshot) {
    this.cache = new Map(Object.entries(state));
    this.hydrated = true;
    this.dirty = true;
    this.scheduleFlush();
  }
}

export const remoteStorage = new RemoteStorage();

export default remoteStorage;

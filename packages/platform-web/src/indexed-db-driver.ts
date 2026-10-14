import type { StorageDriver, StoreName } from '@numception/app';
import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { databaseName } from './database-name';

interface SaveSchema extends DBSchema {
  device: { key: string; value: string };
  profiles: { key: string; value: string };
}

/** The schema version of the database (its object stores), not of the save documents. */
const DB_VERSION = 1;

/** Errors that mean the connection is dead (closed under us), so the next call must reopen. */
const DEAD_CONNECTION = new Set(['InvalidStateError', 'TransactionInactiveError', 'UnknownError']);

/**
 * The IndexedDB `StorageDriver` (AD-10; POC: also used inside the Capacitor iOS
 * WebView, epic Notes). One database per flavour (`databaseName(appId)`) with two
 * object stores of JSON text: `device` and `profiles` (keys `<profileId>:A|B`).
 * Each read or write is one transaction, so a write replaces one value or none.
 *
 * The connection opens lazily and is cached. The cache is dropped, so the next
 * call reopens, when the open fails, when the browser terminates the connection
 * (e.g. WebKit after iOS backgrounding), when another tab needs a newer version
 * (`blocking`: this one closes), and when a transaction fails with a
 * dead-connection error. Also asks the browser to keep the storage persistent
 * (best effort).
 */
export function indexedDbDriver(appId: string): StorageDriver {
  let db: Promise<IDBPDatabase<SaveSchema>> | null = null;
  const open = () => {
    if (db === null) {
      if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is not available'));
      const opening: Promise<IDBPDatabase<SaveSchema>> = openDB<SaveSchema>(databaseName(appId), DB_VERSION, {
        upgrade(database) {
          if (!database.objectStoreNames.contains('device')) database.createObjectStore('device');
          if (!database.objectStoreNames.contains('profiles')) database.createObjectStore('profiles');
        },
        blocking() {
          if (db === opening) db = null;
          void opening.then((d) => d.close());
        },
        terminated() {
          if (db === opening) db = null;
        },
      });
      db = opening;
      opening.catch(() => {
        if (db === opening) db = null;
      });
      void globalThis.navigator?.storage?.persist?.().catch(() => false);
    }
    return db;
  };
  /** Runs `fn` on the open database; a dead-connection error drops the cache before rethrowing. */
  async function withDb<T>(fn: (database: IDBPDatabase<SaveSchema>) => Promise<T>): Promise<T> {
    const opening = open();
    try {
      return await fn(await opening);
    } catch (error) {
      if (error instanceof DOMException && DEAD_CONNECTION.has(error.name) && db === opening) db = null;
      throw error;
    }
  }
  return {
    read: (store: StoreName, keys) =>
      withDb(async (database) => {
        const tx = database.transaction(store, 'readonly');
        const values = await Promise.all(keys.map((key) => tx.store.get(key)));
        await tx.done;
        return values;
      }),
    write: (store: StoreName, key, value) =>
      withDb(async (database) => {
        const tx = database.transaction(store, 'readwrite');
        await Promise.all([tx.store.put(value, key), tx.done]);
      }),
    readAll: () =>
      withDb(async (database) => {
        const tx = database.transaction(['device', 'profiles'], 'readonly');
        const entries = async (name: StoreName) => {
          const store = tx.objectStore(name);
          const [keys, values] = await Promise.all([store.getAllKeys(), store.getAll()]);
          return new Map(keys.map((k, i) => [k, values[i] ?? ''] as const));
        };
        const [device, profiles] = await Promise.all([entries('device'), entries('profiles')]);
        await tx.done;
        return { device, profiles };
      }),
  };
}

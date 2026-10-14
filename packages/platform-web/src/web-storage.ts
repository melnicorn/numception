import { createSlotStorage, type StoragePort } from '@numception/app';
import { indexedDbDriver } from './indexed-db-driver';

/** The web `StoragePort` (AD-10): A/B snapshot slots over the flavour's IndexedDB database. */
export function webStorage(appId: string): StoragePort {
  return createSlotStorage(indexedDbDriver(appId));
}

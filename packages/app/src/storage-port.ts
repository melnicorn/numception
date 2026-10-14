import type { DeviceSettingsDocument, DeviceState, GameState, SaveDocument } from '@numception/core';

/** What loading one profile found (AD-10). */
export type ProfileLoad =
  /** Nothing saved for the profile. */
  | { readonly status: 'empty' }
  /** The highest-generation slot that parsed and passed its checksum. */
  | { readonly status: 'loaded'; readonly game: GameState; readonly generation: number }
  /** Data exists but no slot is valid; it is left as it is. */
  | { readonly status: 'corrupt' }
  /** A slot was written by a newer build: neither load nor overwrite anything (AD-10). */
  | { readonly status: 'too-new' };

/** What loading the device settings found. */
export type DeviceLoad =
  | { readonly status: 'empty' }
  | { readonly status: 'loaded'; readonly device: DeviceState }
  | { readonly status: 'corrupt' }
  | { readonly status: 'too-new' };

/**
 * The persistence port (AD-10, AD-16): every save read and write goes through it.
 * Async; implementations may reject on I/O failure (the save writer retries
 * silently, AD-10). `createSlotStorage` implements it with A/B snapshot slots over
 * a `StorageDriver`; platform adapters provide the driver.
 */
export type StoragePort = {
  /**
   * Boot's one read (AD-10): the device settings and every profile's slots
   * together, so the profile list can be derived from the snapshots that exist
   * when the device record is missing or torn.
   */
  readonly loadAll: () => Promise<SessionLoad>;
  readonly loadDevice: () => Promise<DeviceLoad>;
  readonly loadProfile: (profileId: string) => Promise<ProfileLoad>;
  readonly saveProfile: (profileId: string, doc: SaveDocument) => Promise<void>;
  readonly saveDevice: (doc: DeviceSettingsDocument) => Promise<void>;
};

/** Everything boot reads: the device settings, and each profile's load keyed by profile id. */
export type SessionLoad = { readonly device: DeviceLoad; readonly profiles: ReadonlyMap<string, ProfileLoad> };

/** The stores a driver holds: `device` (one key) and `profiles` (keys `<profileId>:A|B`). */
export type StoreName = 'device' | 'profiles';

/**
 * A raw key-value store of JSON text (a platform adapter, e.g. IndexedDB). Each
 * `write` replaces one value; a crash may leave that one value torn, never others.
 */
export type StorageDriver = {
  /** The values at `keys` of `store` (undefined where absent), read together. */
  readonly read: (store: StoreName, keys: readonly string[]) => Promise<readonly (string | undefined)[]>;
  readonly write: (store: StoreName, key: string, value: string) => Promise<void>;
  /** Every key and value of both stores, read in one transaction. */
  readonly readAll: () => Promise<Readonly<Record<StoreName, ReadonlyMap<string, string>>>>;
};

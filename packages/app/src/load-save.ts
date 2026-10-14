import type { GameState } from '@numception/core';
import type { ProfileLoad, StoragePort } from './storage-port';

/**
 * What the client starts from (AD-10, FR-10):
 *
 * - `restore`: the saved game to continue (`StartSession { restore }`), or null
 *   for a new profile and round.
 * - `generation`: the save's generation, which the writer counts up from.
 * - `writable`: whether saving is safe. False when anything came from a newer
 *   build (never overwrite it), or the storage could not be read in time or at
 *   all (do not risk replacing progress we could not see): play then runs in
 *   memory only.
 */
export type LoadedSession = { readonly restore: GameState | null; readonly generation: number; readonly writable: boolean };

const IN_MEMORY: LoadedSession = { restore: null, generation: 0, writable: false };
const FRESH: LoadedSession = { restore: null, generation: 0, writable: true };

function fromProfile(profile: ProfileLoad | undefined): LoadedSession {
  if (profile?.status === 'too-new') return IN_MEMORY;
  if (profile?.status === 'loaded') return { restore: profile.game, generation: profile.generation, writable: true };
  return FRESH;
}

/**
 * Loads the session before the first paint, in one storage read (`loadAll`):
 * the device settings and every profile's snapshots. Never rejects.
 *
 * - The device record names the active profile: its snapshot is restored; a
 *   corrupt one starts fresh (a new profile id, so its slots stay untouched).
 * - With the device record missing or corrupt (a kill tore it, or landed before
 *   its first write), the profile is derived from the snapshots that exist
 *   (AD-10): the one with the highest valid generation. Any snapshot from a newer
 *   build then means in-memory play.
 * - Gives up after `timeoutMs` (`wait` resolves after it) and plays in memory.
 */
export async function loadSave(storage: StoragePort, wait: (ms: number) => Promise<void>, timeoutMs: number): Promise<LoadedSession> {
  const load = async (): Promise<LoadedSession> => {
    const { device, profiles } = await storage.loadAll();
    if (device.status === 'too-new') return IN_MEMORY;
    if (device.status === 'loaded') {
      const id = device.device.activeProfileId;
      return id === null ? FRESH : fromProfile(profiles.get(id));
    }
    let best: ProfileLoad | undefined;
    for (const profile of profiles.values()) {
      if (profile.status === 'too-new') return IN_MEMORY;
      if (profile.status === 'loaded' && (best?.status !== 'loaded' || profile.generation > best.generation)) best = profile;
    }
    return fromProfile(best);
  };
  const timeout = wait(timeoutMs).then(() => IN_MEMORY);
  return Promise.race([load().catch(() => IN_MEMORY), timeout]);
}

import type { GameState } from '../state/game-state';

/** The current (v3) save payload: one profile's game (AD-10). */
export type SavePayload = { readonly game: GameState };

/**
 * One profile snapshot as persisted (AD-10), JSON only. Every persisted document
 * carries `{ kind, schemaVersion }` (Consistency Conventions).
 *
 * - `saveFormatVersion`: the payload's format (`SAVE_FORMAT_VERSION`).
 * - `generation`: increases with every write of the profile; load picks the
 *   highest-generation slot that parses and passes its checksum.
 * - `checksum`: `saveChecksum(payload)`, over the canonical payload JSON.
 * - `payload`: `SavePayload` at the current version; older versions are migrated.
 */
export type SaveDocument = {
  readonly kind: 'GameSave';
  readonly schemaVersion: 1;
  readonly saveFormatVersion: number;
  readonly generation: number;
  readonly checksum: number;
  readonly payload: unknown;
};

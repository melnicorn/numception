import type { GameState } from '../state/game-state';
import { saveChecksum } from './save-checksum';
import type { SaveDocument, SavePayload } from './save-document';
import { SAVE_FORMAT_VERSION } from './save-format-version';

/**
 * `game` as a save document (AD-10) at the current `SAVE_FORMAT_VERSION`, written
 * as generation `generation` (a non-negative integer the shell counts per
 * profile). The payload is JSON-clean, so `JSON.stringify` of the result is the
 * persisted form.
 */
export function serializeGame(game: GameState, generation: number): SaveDocument {
  const payload: SavePayload = { game };
  return {
    kind: 'GameSave',
    schemaVersion: 1,
    saveFormatVersion: SAVE_FORMAT_VERSION,
    generation,
    checksum: saveChecksum(payload),
    payload,
  };
}

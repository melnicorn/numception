import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import type { GameState } from '../state/game-state';
import { checkGameState } from './check-game-state';
import { MIGRATIONS, type SaveMigrations } from './migrations';
import { saveChecksum } from './save-checksum';
import { SAVE_FORMAT_VERSION } from './save-format-version';

/** A save that loaded: its game (at the current format) and the generation it was written as. */
export type ParsedSave = { readonly game: GameState; readonly generation: number; readonly saveFormatVersion: number };

/** What `parseSave` checks against: the build's format version and migrations (tests pass synthetic ones). */
export type SaveFormat = { readonly version: number; readonly migrations: SaveMigrations };

const CURRENT: SaveFormat = { version: SAVE_FORMAT_VERSION, migrations: MIGRATIONS };

function invalid(message: string): DomainError {
  return { code: 'invalid-save', message };
}

function isCount(x: unknown): x is number {
  return typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
}

/**
 * Parses a persisted save document (the JSON text `serializeGame` gave), never
 * throwing (AD-10):
 *
 * 1. It must be a `GameSave` document, `schemaVersion` 1, with integer
 *    `saveFormatVersion`, `generation` and `checksum` (`invalid-save`).
 * 2. A `schemaVersion` or `saveFormatVersion` newer than this build knows is
 *    `save-too-new`: the caller neither loads nor overwrites it.
 * 3. The checksum must match the payload as stored (`save-checksum-mismatch`).
 * 4. The payload is migrated forward one version at a time (`MIGRATIONS`) to the
 *    current format; a missing step is `invalid-save`.
 * 5. The game must pass `checkGameState` (`invalid-save`).
 */
export function parseSave(json: string, format: SaveFormat = CURRENT): Result<ParsedSave, DomainError> {
  let doc: unknown;
  try {
    doc = JSON.parse(json);
  } catch {
    return err(invalid('save is not valid JSON'));
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return err(invalid('save must be an object'));
  const d = doc as Record<string, unknown>;
  if (d.kind !== 'GameSave') return err(invalid('save kind must be GameSave'));
  if (!isCount(d.schemaVersion) || !isCount(d.saveFormatVersion)) return err(invalid('save versions must be non-negative integers'));
  if (d.schemaVersion > 1 || d.saveFormatVersion > format.version) {
    return err({
      code: 'save-too-new',
      message: `save is schemaVersion ${d.schemaVersion}, saveFormatVersion ${d.saveFormatVersion}; this build reads up to 1, ${format.version}`,
    });
  }
  if (d.schemaVersion !== 1) return err(invalid('save schemaVersion must be 1'));
  if (!isCount(d.generation)) return err(invalid('save generation must be a non-negative integer'));
  if (!isCount(d.checksum) || d.checksum > 0xffffffff) return err(invalid('save checksum must be a uint32'));
  if (saveChecksum(d.payload) !== d.checksum) return err({ code: 'save-checksum-mismatch', message: 'save checksum does not match its payload' });

  let payload = d.payload;
  for (let v = d.saveFormatVersion; v < format.version; v += 1) {
    const migrate = format.migrations[v];
    if (migrate === undefined) return err(invalid(`no migration from saveFormatVersion ${v}`));
    try {
      payload = migrate(payload);
    } catch {
      return err(invalid(`migration from saveFormatVersion ${v} failed`));
    }
  }
  if (typeof payload !== 'object' || payload === null) return err(invalid('save payload must be an object'));
  const game = (payload as Record<string, unknown>).game;
  const bad = checkGameState(game);
  if (bad !== undefined) return err(bad);
  return ok({ game: game as GameState, generation: d.generation, saveFormatVersion: d.saveFormatVersion });
}

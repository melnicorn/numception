/** One forward migration step: a payload at version `v` to version `v + 1`. Pure; never throws on any input. */
export type SaveMigration = (payload: unknown) => unknown;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * 1 → 2: the game gains `softMissLineSeen: false` (no v1 profile has seen the
 * guide line) and every round `softMiss: null` (no cue running) and
 * `guideLine: false`. Anything not shaped like a v1 payload passes through
 * unchanged, for `checkGameState` to reject.
 */
function addSoftMiss(payload: unknown): unknown {
  if (!isRecord(payload) || !isRecord(payload.game)) return payload;
  const game = payload.game;
  const rounds = isRecord(game.rounds) && isRecord(game.rounds.byId) ? game.rounds : undefined;
  const byId =
    rounds === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(rounds.byId as Record<string, unknown>).map(([id, r]) => [id, isRecord(r) ? { ...r, softMiss: null, guideLine: false } : r]),
        );
  return {
    ...payload,
    game: { ...game, softMissLineSeen: false, ...(rounds === undefined ? {} : { rounds: { ...rounds, byId } }) },
  };
}

/** Forward-only migrations, keyed by the version they upgrade from (AD-10). */
export type SaveMigrations = Readonly<Record<number, SaveMigration>>;

/**
 * The shipped save migrations (AD-6, AD-10): `MIGRATIONS[v]` turns a version-`v`
 * payload into a version `v + 1` one. Never removed once shipped, so every old
 * save can be walked forward step by step to `SAVE_FORMAT_VERSION`.
 *
 * - 0 → 1: the bare `GameState` is wrapped as `{ game }`.
 * - 1 → 2: `softMissLineSeen`, and each round's `softMiss` and `guideLine` (`addSoftMiss`).
 */
export const MIGRATIONS: SaveMigrations = {
  0: (payload) => ({ game: payload }),
  1: addSoftMiss,
};

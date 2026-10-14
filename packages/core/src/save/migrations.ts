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

/**
 * 2 → 3: every round gains `themeId: 'kiln'` (every round before themes was drawn
 * in Kiln) and `previousThemeId`: `'kiln'` when it carries a previous round's top
 * (`previousTop`), else null. Anything not shaped like a v2 payload passes
 * through unchanged, for `checkGameState` to reject.
 */
function addTheme(payload: unknown): unknown {
  if (!isRecord(payload) || !isRecord(payload.game)) return payload;
  const game = payload.game;
  if (!isRecord(game.rounds) || !isRecord(game.rounds.byId)) return payload;
  const rounds = game.rounds;
  const byId = Object.fromEntries(
    Object.entries(rounds.byId as Record<string, unknown>).map(([id, r]) => [
      id,
      isRecord(r) ? { ...r, themeId: 'kiln', previousThemeId: r.previousTop === null || r.previousTop === undefined ? null : 'kiln' } : r,
    ]),
  );
  return { ...payload, game: { ...game, rounds: { ...rounds, byId } } };
}

/**
 * 3 → 4: the profile's settings gain `themeSelection: 'randomize'`, `playlist: []`,
 * `effects: true`, `music: false` and `haptics: true` (the Kid defaults, and the
 * defaults of the dev flags they replace), each only where missing. Anything not
 * shaped like a v3 payload passes through unchanged, for `checkGameState` to reject.
 */
function addSettings(payload: unknown): unknown {
  if (!isRecord(payload) || !isRecord(payload.game) || !isRecord(payload.game.settings)) return payload;
  const game = payload.game;
  const settings = { themeSelection: 'randomize', playlist: [], effects: true, music: false, haptics: true, ...(game.settings as Record<string, unknown>) };
  return { ...payload, game: { ...game, settings } };
}

/**
 * 4 → 5: every round gains `transitionId: 'interpolate'`, the token-interpolation
 * look every round change before the transition library drew. Anything not shaped
 * like a v4 payload passes through unchanged, for `checkGameState` to reject.
 */
function addTransition(payload: unknown): unknown {
  if (!isRecord(payload) || !isRecord(payload.game)) return payload;
  const game = payload.game;
  if (!isRecord(game.rounds) || !isRecord(game.rounds.byId)) return payload;
  const rounds = game.rounds;
  const byId = Object.fromEntries(
    Object.entries(rounds.byId as Record<string, unknown>).map(([id, r]) => [id, isRecord(r) ? { transitionId: 'interpolate', ...r } : r]),
  );
  return { ...payload, game: { ...game, rounds: { ...rounds, byId } } };
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
 * - 2 → 3: each round's `themeId` and `previousThemeId` (`addTheme`).
 * - 3 → 4: the settings' theme selection, playlist and feedback switches (`addSettings`).
 * - 4 → 5: each round's `transitionId` (`addTransition`).
 */
export const MIGRATIONS: SaveMigrations = {
  0: (payload) => ({ game: payload }),
  1: addSoftMiss,
  2: addTheme,
  3: addSettings,
  4: addTransition,
};

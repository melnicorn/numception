/** One forward migration step: a payload at version `v` to version `v + 1`. Pure; never throws on any input. */
export type SaveMigration = (payload: unknown) => unknown;

/** Forward-only migrations, keyed by the version they upgrade from (AD-10). */
export type SaveMigrations = Readonly<Record<number, SaveMigration>>;

/**
 * The shipped save migrations (AD-6, AD-10): `MIGRATIONS[v]` turns a version-`v`
 * payload into a version `v + 1` one. Never removed once shipped, so every old
 * save can be walked forward step by step to `SAVE_FORMAT_VERSION`.
 *
 * - 0 → 1: the bare `GameState` is wrapped as `{ game }`.
 */
export const MIGRATIONS: SaveMigrations = {
  0: (payload) => ({ game: payload }),
};

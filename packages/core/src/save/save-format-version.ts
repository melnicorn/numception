/**
 * The save payload format this build writes and the newest it reads (AD-6, AD-10).
 * A save with a higher `saveFormatVersion` is never loaded or overwritten
 * (`save-too-new`); a lower one is migrated forward through `MIGRATIONS`.
 *
 * - 0: the bare `GameState` (entries 1 to 3 kept it only in memory; synthetic).
 * - 1: `{ game: GameState }`, so later fields (the AD-8 ratings checkpoint) sit
 *   beside the game rather than inside it.
 */
export const SAVE_FORMAT_VERSION = 1;

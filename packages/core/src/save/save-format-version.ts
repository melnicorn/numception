/**
 * The save payload format this build writes and the newest it reads (AD-6, AD-10).
 * A save with a higher `saveFormatVersion` is never loaded or overwritten
 * (`save-too-new`); a lower one is migrated forward through `MIGRATIONS`.
 *
 * - 0: the bare `GameState` (entries 1 to 3 kept it only in memory; synthetic).
 * - 1: `{ game: GameState }`, so later fields (the AD-8 ratings checkpoint) sit
 *   beside the game rather than inside it.
 * - 2: the game gains `softMissLineSeen` and each round its soft-miss cue
 *   (`softMiss`) and `guideLine` (ticket 6, FR-4).
 */
export const SAVE_FORMAT_VERSION = 2;

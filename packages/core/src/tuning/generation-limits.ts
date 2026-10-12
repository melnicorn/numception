// Plain constants shared by the tuning schema and the generator's validation, kept
// apart from the schema so the generator doesn't import valibot.

/** The smallest and largest n (cells per puzzle) the generator supports (FR-1). */
export const MIN_N = 3;
export const MAX_N = 9;

/** The largest `retries.maxAttempts` (and so `PuzzleSpec.maxAttempts`). */
export const MAX_ATTEMPTS = 1000;

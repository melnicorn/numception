import type { Operator } from './operator';

/**
 * One difficulty band as the generator reads it (a copy of a tuning band): every
 * cell lies in `minValue..maxValue` and the triple has at most `maxCarries` column
 * carries (`+`) or borrows (`−`). Integers: `band >= 1`, `1 <= minValue`,
 * `minValue + 2 <= maxValue <= MAX_TUNING_VALUE`, `maxCarries >= 0`.
 */
export type PuzzleBand = {
  readonly band: number;
  readonly minValue: number;
  readonly maxValue: number;
  readonly maxCarries: number;
};

/**
 * What to realise at a node (AD-4, AD-19). Integers only: tuning weights are
 * quantised before they get here (`specFor`, AD-3).
 *
 * - `n`: cells per puzzle, 3..9.
 * - `operator`: `add` (a + b = c, the answer c is the largest) or `sub`
 *   (a − b = c, the answer c is the designated smaller cell, b the soft-miss cell).
 * - `band`: the requested band. `fallbackBands`: lower bands, nearest first, tried
 *   in order once `band` runs out of attempts (band numbers strictly decreasing,
 *   each below `band.band`).
 * - `contract`: the answer value the node must produce; absent for an
 *   unconstrained node (a round's top node, the demo). A safe integer: one no band
 *   can host makes `realise` return `unrealisable`.
 * - `nearMissCount`: how many of the n − 3 distractors are near-misses, 0..n − 3.
 * - `nearMissDelta`: a near-miss lies within this (>= 1) of some other cell pair's
 *   sum or difference.
 * - `maxAttempts`: realisation attempts per band, 1..1000.
 */
export type PuzzleSpec = {
  readonly n: number;
  readonly operator: Operator;
  readonly band: PuzzleBand;
  readonly fallbackBands: readonly PuzzleBand[];
  readonly contract?: number;
  readonly nearMissCount: number;
  readonly nearMissDelta: number;
  readonly maxAttempts: number;
};

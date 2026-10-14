import type { Operator } from '../generator/operator';

/**
 * The difficulty features of a realised puzzle that its bucket groups by (addendum
 * A2, AD-8). Definitions are owned by `difficultyModelVersion`; changing one is a
 * version bump, which gives every bucket a new key.
 *
 * - `digits`: digit count of the largest cell.
 * - `carries`: column carries of `a + b` (for +) or borrows of `a − b` (for −) of the triple.
 * - `n`: cells in the puzzle.
 * - `nearMisses`: near-miss distractors placed.
 *
 * Ties are always 0 in the POC (all cells distinct), so they have no segment.
 */
export type BucketFeatures = {
  readonly difficultyModelVersion: number;
  readonly operator: Operator;
  readonly digits: number;
  readonly carries: number;
  readonly n: number;
  readonly nearMisses: number;
};

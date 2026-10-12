import type { Rational } from '../numbers/rational';
import type { NodeId } from './node-id';
import type { PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';

/**
 * The cell indices (placement order) of the puzzle's one valid triple, by role:
 * `add` reads a + b = c, `sub` reads a − b = c. Either way c is the answer and
 * `a` the largest of the three for `sub`; for `sub`, b is the soft-miss cell.
 */
export type PuzzleRoles = { readonly a: number; readonly b: number; readonly c: number };

/** Recorded when a puzzle is served below the requested band (band fallback). */
export type PuzzleClamp = { readonly requestedBand: number; readonly servedBand: number };

/**
 * A realised puzzle: everything needed to show it and to reproduce it.
 *
 * - `cells`: the values in placement order, `spec.n` of them, distinct positive
 *   integers with exactly one valid triple among them.
 * - `roles`: where the triple's cells sit; `answerIndex` is `roles.c`.
 * - `servedBand`: the band the puzzle was realised in; `clamp` is present only
 *   when that is a fallback band.
 * - `nearMisses`: the near-miss distractors actually placed. Fewer than
 *   `spec.nearMissCount` only when a band's attempts ran out (the shortfall).
 */
export type Puzzle = {
  readonly seed: number;
  readonly nodeId: NodeId;
  readonly spec: PuzzleSpec;
  readonly cells: readonly Rational[];
  readonly roles: PuzzleRoles;
  readonly answerIndex: number;
  readonly servedBand: number;
  readonly clamp?: PuzzleClamp;
  readonly nearMisses: number;
  readonly versions: PuzzleVersions;
};

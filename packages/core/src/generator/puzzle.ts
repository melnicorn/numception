import type { Rational } from '../numbers/rational';
import type { NodeId } from './node-id';
import type { PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';

/**
 * A realised puzzle: everything needed to show it and to reproduce it.
 *
 * - `cells`: the values in placement order, `spec.n` of them, all distinct.
 * - `answerIndex`: the cell that is the answer. For `add` it equals the sum of the
 *   other two.
 */
export type Puzzle = {
  readonly seed: number;
  readonly nodeId: NodeId;
  readonly spec: PuzzleSpec;
  readonly cells: readonly Rational[];
  readonly answerIndex: number;
  readonly versions: PuzzleVersions;
};

import type { Operator } from './operator';

/**
 * What to realise at a node: the shape and the value range. In the POC tracer it is
 * built straight from the tuning; later the selector picks it under the node's
 * answer contract (AD-4, AD-9).
 *
 * - `n`: cells per puzzle (3 only, for now).
 * - `maxValue`: the largest value any cell may hold; an integer in 3..2^31 − 1.
 */
export type PuzzleSpec = { readonly n: 3; readonly operator: Operator; readonly maxValue: number };

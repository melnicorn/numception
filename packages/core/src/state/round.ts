import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import type { RoundPlan } from '../rounds/round-plan';
import type { NodeKey } from './node-key';

/**
 * One round (AD-24, minimal for the play-loop tracer: Classic only, Zen, no
 * presentation timeline or mode state yet).
 *
 * - `seed`: `deriveSeed(rootSeed, roundOrdinal)`, the plan's round seed (AD-4).
 * - `tuningVersion`: the tuning the round is pinned to (AD-7).
 * - `puzzles`: the leaves realised so far, frozen once realised (AD-4). Upper-tier
 *   puzzles live in `plan`.
 * - `solved`: the nodes solved, in solve order.
 * - `viewPath`: the puzzle in view is the last entry; the top is first (AD-25).
 */
export type Round = {
  readonly roundId: string;
  readonly type: 'classic';
  readonly seed: number;
  readonly mode: 'zen';
  readonly tuningVersion: number;
  readonly plan: RoundPlan;
  readonly puzzles: Readonly<Record<NodeKey, Puzzle>>;
  readonly solved: readonly NodeKey[];
  readonly viewPath: readonly NodeId[];
};

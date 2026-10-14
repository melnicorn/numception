import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import type { Presentation } from '../presentation/presentation';
import type { RoundPlan, RoundTypeName } from '../rounds/round-plan';
import type { NodeKey } from './node-key';

/**
 * One round (AD-24; Classic or Tower, Zen, no mode state yet).
 *
 * - `seed`: `deriveSeed(rootSeed, roundOrdinal)`, the plan's round seed (AD-4).
 * - `tuningVersion`: the tuning the round is pinned to (AD-7).
 * - `puzzles`: the leaves realised so far, frozen once realised (AD-4). Upper-tier
 *   puzzles live in `plan`.
 * - `solved`: the nodes solved, in solve order. A correct tap's node joins it when
 *   its `solve` beat ends.
 * - `viewPath`: the NodeId stack from the top to the node in view, which is last
 *   (AD-25). That node is a puzzle when it is a leaf or all its children are
 *   solved, and an overview of its children otherwise.
 * - `presentation`: the beat running (AD-20).
 * - `shownAtMs`: the `clockMs` at which the puzzle in view became idle and shown,
 *   which `responseMs` counts from; null while an overview is in view.
 * - `nextRoundId`: the id the next round takes, reserved from the tap that solved
 *   the top (AD-22), so the round's end needs no entropy of its own.
 * - `previousTop`: the solved top puzzle of the round this one followed, null for
 *   a session's first round. View data only (AD-13): the completed round is
 *   dropped, and the `roundStart` crossfade draws its top fading out.
 */
export type Round = {
  readonly roundId: string;
  readonly type: RoundTypeName;
  readonly seed: number;
  readonly mode: 'zen';
  readonly tuningVersion: number;
  readonly plan: RoundPlan;
  readonly puzzles: Readonly<Record<NodeKey, Puzzle>>;
  readonly solved: readonly NodeKey[];
  readonly viewPath: readonly NodeId[];
  readonly presentation: Presentation;
  readonly shownAtMs: number | null;
  readonly nextRoundId: string | null;
  readonly previousTop: Puzzle | null;
};

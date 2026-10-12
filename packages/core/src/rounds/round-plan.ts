import type { NodeId } from '../generator/node-id';
import type { Operator } from '../generator/operator';
import type { Puzzle } from '../generator/puzzle';
import type { PuzzleVersions } from '../generator/puzzle-versions';

/** The round types this build plans (FR-2). Pyramid, Rapid Fire and Daily are v1. */
export const ROUND_TYPE_NAMES = ['classic', 'tower'] as const;

/** A round type this build plans. */
export type RoundTypeName = (typeof ROUND_TYPE_NAMES)[number];

/**
 * Pins the top puzzle's cell `childIndex` (placement order) to `value` (OQ-4): the
 * hook that later lets a Pyramid grow upward, the old top becoming child
 * `childIndex` of a new top whose cell there is the old top's answer.
 */
export type FixedTopCell = { readonly childIndex: number; readonly value: number };

/**
 * What to plan: a round type, n cells per puzzle (3..9), the operator, the round's
 * starting band (default 1; upper-tier puzzles are realised in it) and optionally
 * a fixed top cell.
 */
export type PlanRequest = {
  readonly type: RoundTypeName;
  readonly n: number;
  readonly operator: Operator;
  readonly band?: number;
  readonly fixedTopCell?: FixedTopCell;
};

/**
 * One node of a plan. Upper-tier nodes (tier >= 2) carry their realised `puzzle`;
 * every node below the top carries its answer `contract` (the parent's cell value);
 * tier-1 nodes carry only the contract and are realised lazily (AD-4).
 */
export type RoundPlanNode = {
  readonly nodeId: NodeId;
  readonly contract?: number;
  readonly puzzle?: Puzzle;
};

/**
 * A planned round (FR-2, AD-4), JSON-safe. Everything above tier 1 is fixed before
 * the player starts tier 1.
 *
 * - `roundSeed`: the seed every node stream derives from (`deriveSeed(rootSeed, ordinal)`).
 * - `tiers`: 2 for Classic (n + 1 nodes), 3 for Tower (n² + n + 1 nodes).
 * - `nodes`: every node, top-down (tier descending, then index).
 * - `fixedTopCell`: echoed when the request pinned one.
 * - `versions`: the versions every puzzle of the round is realised with.
 */
export type RoundPlan = {
  readonly kind: 'RoundPlan';
  readonly schemaVersion: 1;
  readonly roundSeed: number;
  readonly type: RoundTypeName;
  readonly n: number;
  readonly operator: Operator;
  readonly startBand: number;
  readonly tiers: number;
  readonly fixedTopCell?: FixedTopCell;
  readonly nodes: readonly RoundPlanNode[];
  readonly versions: PuzzleVersions;
};

import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import type { PuzzleVersions } from '../generator/puzzle-versions';
import type { DomainError } from '../result/domain-error';
import { err, type Result } from '../result/result';
import type { TuningConfig } from '../tuning/tuning-config';
import { planTiers } from './plan-tiers';
import { realisePlanNode } from './realise-plan-node';
import { childrenOf, parentOf, topNodeId } from './round-node-id';
import type { PlanRequest, RoundPlan, RoundTypeName } from './round-plan';

/** Whether a node of the round is solved, as the caller's progress records it. */
export type IsSolved = (node: NodeId) => boolean;

/** What solving a node did to the round's tiers: the parent it completed, which collapses (null for none). */
export type SolveOutcome = { readonly collapsesInto: NodeId | null };

/**
 * One round type (FR-2, AD-4, AD-24): how many tiers it has, how a round is
 * planned, how one of its nodes is realised, what a solve does and when the round
 * is complete. Later types (Pyramid) add their own entries.
 */
export type RoundType = {
  readonly type: RoundTypeName;
  readonly tiers: number;
  /** Plans a round from `roundSeed` (`deriveSeed(rootSeed, ordinal)`). */
  readonly plan: (request: PlanRequest, tuning: TuningConfig, roundSeed: number, versions: PuzzleVersions) => Result<RoundPlan, DomainError>;
  /** The puzzle at `nodeId`: planned (upper tiers) or realised now in `band` (leaves). */
  readonly realise: (plan: RoundPlan, nodeId: NodeId, band: number, tuning: TuningConfig) => Result<Puzzle, DomainError>;
  /**
   * After `nodeId` was solved (`isSolved` already counts it): the parent whose last
   * unsolved child it was collapses into its cell (EXPERIENCE Flow 4, "collapse in
   * threes"); solving the top collapses nothing.
   */
  readonly onSolve: (plan: RoundPlan, nodeId: NodeId, isSolved: IsSolved) => SolveOutcome;
  /** Whether the round is complete: its top puzzle is solved. */
  readonly isComplete: (plan: RoundPlan, isSolved: IsSolved) => boolean;
};

/** Classic and Tower: a group collapses into its parent once all n children are solved. */
function onSolveTiers(plan: RoundPlan, nodeId: NodeId, isSolved: IsSolved): SolveOutcome {
  if (nodeId.tier >= plan.tiers) return { collapsesInto: null };
  const { parent } = parentOf(nodeId, plan.n);
  return { collapsesInto: childrenOf(parent, plan.n).every(isSolved) ? parent : null };
}

function isTopSolved(plan: RoundPlan, isSolved: IsSolved): boolean {
  return isSolved(topNodeId(plan.tiers));
}

function roundType(type: RoundTypeName, tiers: number): RoundType {
  return Object.freeze({
    type,
    tiers,
    plan: (request: PlanRequest, tuning: TuningConfig, roundSeed: number, versions: PuzzleVersions) =>
      planTiers(type, tiers, request, tuning, roundSeed, versions),
    realise: (plan: RoundPlan, nodeId: NodeId, band: number, tuning: TuningConfig) => realisePlanNode(type, tiers, plan, nodeId, band, tuning),
    onSolve: onSolveTiers,
    isComplete: isTopSolved,
  });
}

/**
 * The round types of this build: Classic (n tier-1 puzzles under one tier-2 puzzle)
 * and Tower (n² + n + 1 puzzles over three tiers).
 */
export const ROUND_TYPES: { readonly classic: RoundType; readonly tower: RoundType } = Object.freeze({
  classic: roundType('classic', 2),
  tower: roundType('tower', 3),
});

/** The round type `x` names, or undefined. */
export function roundTypeOf(x: unknown): RoundType | undefined {
  return typeof x === 'string' && Object.hasOwn(ROUND_TYPES, x) ? ROUND_TYPES[x as RoundTypeName] : undefined;
}

/** Plans a round with the round type `request.type` names; an unknown type is `invalid-request`. */
export function planRound(request: PlanRequest, tuning: TuningConfig, roundSeed: number, versions: PuzzleVersions): Result<RoundPlan, DomainError> {
  const rt = typeof request === 'object' && request !== null ? roundTypeOf(request.type) : undefined;
  if (rt === undefined) return err({ code: 'invalid-request', message: `request.type must be one of ${Object.keys(ROUND_TYPES).join(', ')}` });
  return rt.plan(request, tuning, roundSeed, versions);
}

/** Realises a node of `plan` with the round type `plan.type` names. */
export function realiseRoundNode(plan: RoundPlan, nodeId: NodeId, band: number, tuning: TuningConfig): Result<Puzzle, DomainError> {
  const rt = typeof plan === 'object' && plan !== null ? roundTypeOf(plan.type) : undefined;
  if (rt === undefined) return err({ code: 'invalid-request', message: `plan.type must be one of ${Object.keys(ROUND_TYPES).join(', ')}` });
  return rt.realise(plan, nodeId, band, tuning);
}

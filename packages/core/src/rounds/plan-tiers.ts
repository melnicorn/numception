import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import type { PuzzleSpec } from '../generator/puzzle-spec';
import type { PuzzleVersions } from '../generator/puzzle-versions';
import { realise } from '../generator/realise';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { specFor } from '../spec/spec-for';
import type { TuningConfig } from '../tuning/tuning-config';
import { attemptSeed } from './attempt-seed';
import { contractFloor } from './contract-floor';
import { moveCell } from './move-cell';
import { type CheckedRequest, checkPlanRequest } from './plan-request';
import type { PlanRequest, RoundPlan, RoundPlanNode, RoundTypeName } from './round-plan';
import { childNodeId, compareTopDown, topNodeId } from './round-node-id';

/** Plan-time realisations of one upper-tier node before falling back to its parent. */
export const NODE_PLAN_ATTEMPTS = 16;

/**
 * Realisations an unconstrained top may draw in all. Draws holding a cell below
 * the children's contract floor are discarded without counting toward
 * NODE_PLAN_ATTEMPTS (they can never plan), up to this many draws in total.
 */
export const TOP_DRAW_LIMIT = 256;

/** Candidate top puzzles searched for a fixed top cell (OQ-4). */
export const FIXED_TOP_ATTEMPTS = 64;

/** Leaf contracts must be realisable at tier 1 in the lowest band (epic Notes). */
export const LEAF_CHECK_BAND = 1;

type Context = CheckedRequest & {
  readonly tuning: TuningConfig;
  readonly roundSeed: number;
  readonly versions: PuzzleVersions;
  /**
   * Memoised outcomes, per node and contract (`tier/index:contract`): a leaf's band-1
   * check (true or false) and an upper-tier node's failure (false). A node's outcome
   * depends only on its own id, contract and the round seed (its streams), so this
   * is pure memoisation: it never carries one node's result over to another node.
   */
  readonly memo: Map<string, boolean>;
};

function memoKey(node: NodeId, contract: number): string {
  return `${node.tier}/${node.index}:${contract}`;
}

/**
 * Whether `node` is known unplannable with `contract`: below what its tier can
 * possibly take (`contractFloor`, true for every node and stream) or already failed
 * for this very node.
 */
function isBad(ctx: Context, node: NodeId, contract: number): boolean {
  return contract < contractFloor(ctx.operator, node.tier) || ctx.memo.get(memoKey(node, contract)) === false;
}

/**
 * A subtree's nodes, or why not: `hard` is an error to return as is; without it, the
 * subtree is unplannable, and a top-level failure says why in `reason`.
 */
type Outcome =
  | { readonly ok: true; readonly nodes: RoundPlanNode[] }
  | { readonly ok: false; readonly hard?: DomainError; readonly reason?: string };

const FAIL: Outcome = { ok: false };

function hard(error: DomainError): Outcome {
  return { ok: false, hard: error };
}

function fail(reason: string): Outcome {
  return { ok: false, reason };
}

function specAt(ctx: Context, band: number, contract?: number): Result<PuzzleSpec, DomainError> {
  return specFor(ctx.tuning, { n: ctx.n, operator: ctx.operator, band, ...(contract === undefined ? {} : { contract }) });
}

/**
 * Whether leaf `leaf` can realise `contract` in band 1: realised for real with the
 * leaf's own stream (`nodeStream(roundSeed, leaf)`) and the result discarded. The
 * leaf is realised again later, in the band the selector picks.
 */
function leafRealisable(ctx: Context, leaf: NodeId, contract: number): boolean | DomainError {
  if (isBad(ctx, leaf, contract)) return false;
  const key = memoKey(leaf, contract);
  if (ctx.memo.get(key) === true) return true;
  const spec = specAt(ctx, LEAF_CHECK_BAND, contract);
  if (!spec.ok) return spec.error;
  const result = realise(ctx.roundSeed, leaf, spec.value, ctx.versions);
  if (!result.ok && result.error.code !== 'unrealisable') return result.error;
  ctx.memo.set(key, result.ok);
  return result.ok;
}

/**
 * Plans the children of `parent` (realised as `puzzle`): child j takes cell j's
 * value as its contract. Leaves are checked for band-1 realisability; upper-tier
 * children are planned recursively. Fails at the first unplannable child.
 */
function planChildren(ctx: Context, parent: NodeId, puzzle: Puzzle): Outcome {
  // Cheap pass first: a child already known unplannable with its contract fails the node.
  for (let j = 0; j < ctx.n; j += 1) if (isBad(ctx, childNodeId(parent, ctx.n, j), puzzle.cells[j]!.n)) return FAIL;
  const nodes: RoundPlanNode[] = [];
  for (let j = 0; j < ctx.n; j += 1) {
    const child = childNodeId(parent, ctx.n, j);
    const contract = puzzle.cells[j]!.n;
    if (child.tier === 1) {
      const check = leafRealisable(ctx, child, contract);
      if (typeof check !== 'boolean') return hard(check);
      if (!check) return FAIL;
      nodes.push({ nodeId: child, contract });
    } else {
      const sub = planUpper(ctx, child, contract);
      if (!sub.ok) return sub;
      nodes.push(...sub.nodes);
    }
  }
  return { ok: true, nodes };
}

/**
 * Plans an upper-tier node below the top, whose answer must be `contract`: up to
 * NODE_PLAN_ATTEMPTS realisations in the starting band, each from its own attempt
 * seed (so an `unrealisable` attempt moves on to the next stream), each kept only
 * if all its children plan. A node that fails is memoised as failed for `contract`.
 */
function planUpper(ctx: Context, node: NodeId, contract: number): Outcome {
  if (isBad(ctx, node, contract)) return FAIL;
  const spec = specAt(ctx, ctx.startBand, contract);
  if (!spec.ok) return hard(spec.error);
  for (let attempt = 0; attempt < NODE_PLAN_ATTEMPTS; attempt += 1) {
    const result = realise(attemptSeed(ctx.roundSeed, attempt), node, spec.value, ctx.versions);
    if (!result.ok) {
      if (result.error.code !== 'unrealisable') return hard(result.error);
      continue;
    }
    const children = planChildren(ctx, node, result.value);
    if (children.ok) return { ok: true, nodes: [{ nodeId: node, contract, puzzle: result.value }, ...children.nodes] };
    if (children.hard) return children;
  }
  ctx.memo.set(memoKey(node, contract), false);
  return FAIL;
}

const LEAF_RULE = `every leaf contract must realise in band ${LEAF_CHECK_BAND}`;

/**
 * Plans the top node, unconstrained in the starting band, and everything below it:
 * up to NODE_PLAN_ATTEMPTS counted draws (an unrealisable draw counts and moves on to
 * the next stream, as in planUpper; a draw below the contract floor doesn't count),
 * within TOP_DRAW_LIMIT draws in all.
 */
function planFreeTop(ctx: Context, top: NodeId): Outcome {
  const spec = specAt(ctx, ctx.startBand);
  if (!spec.ok) return hard(spec.error);
  const floor = contractFloor(ctx.operator, top.tier - 1);
  let counted = 0;
  let unrealisable = 0;
  let lastUnrealisable = '';
  for (let attempt = 0; attempt < TOP_DRAW_LIMIT && counted < NODE_PLAN_ATTEMPTS; attempt += 1) {
    const result = realise(attemptSeed(ctx.roundSeed, attempt), top, spec.value, ctx.versions);
    if (!result.ok) {
      if (result.error.code !== 'unrealisable') return hard(result.error);
      // As in planUpper: an unrealisable draw spends an attempt; the next has its own stream.
      counted += 1;
      unrealisable += 1;
      lastUnrealisable = result.error.message;
      continue;
    }
    // A top with a cell below the floor can never plan: discard it uncounted.
    if (result.value.cells.some((c) => c.n < floor)) continue;
    counted += 1;
    const children = planChildren(ctx, top, result.value);
    if (children.ok) return { ok: true, nodes: [{ nodeId: top, puzzle: result.value }, ...children.nodes] };
    if (children.hard) return children;
  }
  if (counted === 0) return fail(`none of ${TOP_DRAW_LIMIT} top puzzles had every cell at least ${floor}, the smallest contract tier ${top.tier - 1} can take`);
  if (unrealisable === counted) return fail(`the top puzzle is unrealisable in start band ${ctx.startBand} (${counted} attempts): ${lastUnrealisable}`);
  const realised = counted - unrealisable;
  const skipped = unrealisable === 0 ? '' : `; ${unrealisable} more were unrealisable`;
  return fail(`none of ${realised} top puzzles with every cell at least ${floor} had every child plannable (${LEAF_RULE}${skipped})`);
}

/**
 * Plans a top node whose cell `childIndex` is `value` (OQ-4): a bounded search over
 * FIXED_TOP_ATTEMPTS candidate top puzzles in the starting band. Even attempts are
 * unconstrained; odd attempts take `value` as their answer contract, so they contain
 * it by construction (until that contract proves unrealisable, after which every
 * attempt is unconstrained). A candidate containing `value` has that cell swapped
 * into `childIndex` (roles and answerIndex follow, `moveCell`) and is kept if all
 * its children plan.
 */
function planFixedTop(ctx: Context, top: NodeId, childIndex: number, value: number): Outcome {
  const free = specAt(ctx, ctx.startBand);
  if (!free.ok) return hard(free.error);
  const floor = contractFloor(ctx.operator, top.tier - 1);
  if (value < floor) return fail(`the fixed value is below ${floor}, the smallest contract tier ${top.tier - 1} can take`);
  const pinned = specAt(ctx, ctx.startBand, value);
  if (!pinned.ok) return hard(pinned.error);
  let pinnedRealisable = true;
  let candidates = 0;
  for (let attempt = 0; attempt < FIXED_TOP_ATTEMPTS; attempt += 1) {
    const usePinned = pinnedRealisable && attempt % 2 === 1;
    const result = realise(attemptSeed(ctx.roundSeed, attempt), top, usePinned ? pinned.value : free.value, ctx.versions);
    if (!result.ok) {
      if (result.error.code !== 'unrealisable') return hard(result.error);
      if (usePinned) pinnedRealisable = false;
      continue;
    }
    const at = result.value.cells.findIndex((c) => c.n === value);
    if (at < 0) continue;
    candidates += 1;
    const puzzle = moveCell(result.value, at, childIndex);
    const children = planChildren(ctx, top, puzzle);
    if (children.ok) return { ok: true, nodes: [{ nodeId: top, puzzle }, ...children.nodes] };
    if (children.hard) return children;
  }
  return candidates === 0
    ? fail(`none of ${FIXED_TOP_ATTEMPTS} candidate top puzzles contained the fixed value`)
    : fail(`none of the ${candidates} candidate top puzzles containing the fixed value had every child plannable (${LEAF_RULE})`);
}

/**
 * Plans a round of `tiers` tiers top-down (FR-2, AD-4):
 *
 * - the top is realised unconstrained in the starting band (or carries the fixed
 *   top cell);
 * - every upper-tier node below it is realised in the starting band with its
 *   parent's cell value as its answer contract;
 * - every leaf (tier 1) gets its parent's cell value as its contract, which must
 *   realise in band 1 with the leaf's own stream; leaves are realised for real later.
 *
 * A node with an unplannable child is re-planned from its next attempt seed; when
 * its attempts run out the failure falls back to its parent, and at the top it is
 * `unplannable`. Every loop is bounded (NODE_PLAN_ATTEMPTS, TOP_DRAW_LIMIT, FIXED_TOP_ATTEMPTS, n).
 *
 * Pure and deterministic (AD-3): same inputs, same plan. Never throws on bad input.
 */
export function planTiers(
  type: RoundTypeName,
  tiers: number,
  request: PlanRequest,
  tuning: TuningConfig,
  roundSeed: number,
  versions: PuzzleVersions,
): Result<RoundPlan, DomainError> {
  const checked = checkPlanRequest(type, request, tuning, roundSeed, versions);
  if ('code' in checked) return err(checked);
  const ctx: Context = { ...checked, tuning, roundSeed, versions, memo: new Map() };
  const top = topNodeId(tiers);
  const fixed = checked.fixedTopCell;
  const outcome = fixed === undefined ? planFreeTop(ctx, top) : planFixedTop(ctx, top, fixed.childIndex, fixed.value);
  if (!outcome.ok) {
    if (outcome.hard) return err(outcome.hard);
    const pin = fixed === undefined ? '' : ` with top cell ${fixed.childIndex} = ${fixed.value}`;
    return err({
      code: 'unplannable',
      message: `no ${type} round (${checked.operator}, n ${checked.n}, start band ${checked.startBand}${pin}) could be planned from round seed ${roundSeed}: ${outcome.reason ?? LEAF_RULE}`,
    });
  }
  return ok({
    kind: 'RoundPlan',
    schemaVersion: 1,
    roundSeed,
    type,
    n: checked.n,
    operator: checked.operator,
    startBand: checked.startBand,
    tiers,
    ...(fixed === undefined ? {} : { fixedTopCell: fixed }),
    nodes: [...outcome.nodes].sort((x, y) => compareTopDown(x.nodeId, y.nodeId)),
    versions: {
      generatorVersion: versions.generatorVersion,
      difficultyModelVersion: versions.difficultyModelVersion,
      tuningVersion: versions.tuningVersion,
    },
  });
}

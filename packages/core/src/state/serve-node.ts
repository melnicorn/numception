import type { NodeId } from '../generator/node-id';
import type { DomainError } from '../result/domain-error';
import { ok, type Result } from '../result/result';
import { realiseRoundNode } from '../rounds/round-types';
import type { TuningConfig } from '../tuning/tuning-config';
import { nodeKey } from './node-key';
import type { Round } from './round';

/** The band leaves are realised in until the selector arrives (epic-adaptive-difficulty). */
export const LEAF_BAND = 1;

/**
 * `round` with `node`'s puzzle ready to show: a leaf not realised yet is realised
 * now in `LEAF_BAND` and frozen into `puzzles` (AD-4); upper tiers are in the plan.
 */
export function serveNode(round: Round, node: NodeId, tuning: TuningConfig): Result<Round, DomainError> {
  const key = nodeKey(node);
  if (node.tier > 1 || round.puzzles[key] !== undefined) return ok(round);
  const leaf = realiseRoundNode(round.plan, node, LEAF_BAND, tuning);
  if (!leaf.ok) return leaf;
  return ok({ ...round, puzzles: { ...round.puzzles, [key]: leaf.value } });
}

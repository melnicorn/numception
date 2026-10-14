import type { NodeId } from '../generator/node-id';
import type { DomainError } from '../result/domain-error';
import { ok, type Result } from '../result/result';
import { realiseRoundNode } from '../rounds/round-types';
import type { TuningConfig } from '../tuning/tuning-config';
import { pinnedTuning, type TuningsByVersion } from '../tuning/tunings-by-version';
import { nodeKey } from './node-key';
import type { Round } from './round';

/** The band leaves are realised in until the selector arrives (epic-adaptive-difficulty). */
export const LEAF_BAND = 1;

/**
 * `round` with `node`'s puzzle ready to show: a leaf not realised yet is realised
 * now in `LEAF_BAND` and frozen into `puzzles` (AD-4); upper tiers are in the plan.
 * Leaves are realised under the tuning the round is pinned to (AD-7:
 * `round.tuningVersion`, from `tunings`), so a round saved under an older tuning
 * still finishes after the active tuning moves on.
 */
export function serveNode(round: Round, node: NodeId, tuning: TuningConfig, tunings: TuningsByVersion = {}): Result<Round, DomainError> {
  const key = nodeKey(node);
  if (node.tier > 1 || round.puzzles[key] !== undefined) return ok(round);
  const leaf = realiseRoundNode(round.plan, node, LEAF_BAND, pinnedTuning(round.tuningVersion, tuning, tunings));
  if (!leaf.ok) return leaf;
  return ok({ ...round, puzzles: { ...round.puzzles, [key]: leaf.value } });
}

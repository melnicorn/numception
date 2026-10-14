import { versionsFor } from '../generator/versions-for';
import { deriveSeed } from '../random/derive-seed';
import type { DomainError } from '../result/domain-error';
import { ok, type Result } from '../result/result';
import { childrenOf, topNodeId } from '../rounds/round-node-id';
import { planRound, realiseRoundNode } from '../rounds/round-types';
import type { TuningConfig } from '../tuning/tuning-config';
import { CLASSIC_REQUEST } from './classic-request';
import { nodeKey } from './node-key';
import type { Round } from './round';

/** The band leaves are realised in until the selector arrives (epic-adaptive-difficulty). */
export const LEAF_BAND = 1;

/**
 * Plans round `roundOrdinal` of a profile seeded `rootSeed` (AD-4: seed
 * `deriveSeed(rootSeed, roundOrdinal)`), realises its first leaf in `LEAF_BAND` and
 * views it: `viewPath` is `[top, firstLeaf]` (AD-25).
 */
export function startRound(roundId: string, rootSeed: number, roundOrdinal: number, tuning: TuningConfig): Result<Round, DomainError> {
  const seed = deriveSeed(rootSeed, roundOrdinal);
  const plan = planRound(CLASSIC_REQUEST, tuning, seed, versionsFor(tuning));
  if (!plan.ok) return plan;
  const top = topNodeId(plan.value.tiers);
  const [first] = childrenOf(top, plan.value.n);
  if (first === undefined) return { ok: false, error: { code: 'invalid-request', message: 'plan has no leaves' } };
  const leaf = realiseRoundNode(plan.value, first, LEAF_BAND, tuning);
  if (!leaf.ok) return leaf;
  return ok({
    roundId,
    type: 'classic',
    seed,
    mode: 'zen',
    tuningVersion: tuning.tuningVersion,
    plan: plan.value,
    puzzles: { [nodeKey(first)]: leaf.value },
    solved: [],
    viewPath: [top, first],
  });
}

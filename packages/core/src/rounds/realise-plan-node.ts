import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import { realise } from '../generator/realise';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { specFor } from '../spec/spec-for';
import type { TuningConfig } from '../tuning/tuning-config';
import { LEAF_CHECK_BAND } from './plan-tiers';
import type { RoundPlan, RoundTypeName } from './round-plan';
import { isInRound } from './round-node-id';

function invalid(message: string): { readonly ok: false; readonly error: DomainError } {
  return err({ code: 'invalid-request', message });
}

/**
 * The puzzle at `nodeId` of a `type` plan (AD-4). An upper-tier node returns its
 * planned puzzle (`band` is ignored). A leaf is realised now from the plan's round
 * seed (the leaf's own stream), its contract and `band` (the selector's pick):
 *
 * - first in `band`, then each lower band above band 1 (`specFor`'s fallbacks);
 * - if none of those can serve it, in band 1 exactly as the planner's check did
 *   (a fresh leaf stream, the band-1 spec), so the contract the plan guaranteed is
 *   always met. That puzzle records `clamp: { requestedBand: band, servedBand: 1 }`;
 *   its `spec` is the band-1 spec, which reproduces its cells.
 *
 * `tuning` must be the one the plan was made with (same tuningVersion).
 */
export function realisePlanNode(
  type: RoundTypeName,
  tiers: number,
  plan: RoundPlan,
  nodeId: NodeId,
  band: number,
  tuning: TuningConfig,
): Result<Puzzle, DomainError> {
  if (typeof plan !== 'object' || plan === null || plan.kind !== 'RoundPlan' || plan.schemaVersion !== 1 || !Array.isArray(plan.nodes)) {
    return invalid('plan must be a RoundPlan, schemaVersion 1');
  }
  if (plan.type !== type || plan.tiers !== tiers) return invalid(`plan is a ${String(plan.type)} plan, not ${type}`);
  if (!isInRound(nodeId, tiers, plan.n)) {
    return err({ code: 'invalid-node-id', message: `nodeId is not a node of this ${type} round (tiers 1..${tiers}, n ${plan.n})` });
  }
  const node = plan.nodes.find((x) => x.nodeId.tier === nodeId.tier && x.nodeId.index === nodeId.index);
  if (node === undefined) return invalid(`plan has no node (${nodeId.tier}, ${nodeId.index})`);
  if (nodeId.tier > 1) {
    return node.puzzle === undefined ? invalid(`plan node (${nodeId.tier}, ${nodeId.index}) has no puzzle`) : ok(node.puzzle);
  }
  if (node.contract === undefined || !Number.isSafeInteger(node.contract)) {
    return invalid(`plan leaf (1, ${nodeId.index}) has no integer contract`);
  }
  if (tuning.tuningVersion !== plan.versions.tuningVersion) {
    return invalid(`tuning ${tuning.tuningVersion} is not the plan's tuning ${plan.versions.tuningVersion}`);
  }
  const request = { n: plan.n, operator: plan.operator, contract: node.contract };
  const spec = specFor(tuning, { ...request, band });
  if (!spec.ok) return spec;
  if (band !== LEAF_CHECK_BAND) {
    const above = { ...spec.value, fallbackBands: spec.value.fallbackBands.filter((b) => b.band > LEAF_CHECK_BAND) };
    const result = realise(plan.roundSeed, nodeId, above, plan.versions);
    if (result.ok || result.error.code !== 'unrealisable') return result;
  }
  const check = specFor(tuning, { ...request, band: LEAF_CHECK_BAND });
  if (!check.ok) return check;
  const result = realise(plan.roundSeed, nodeId, check.value, plan.versions);
  if (!result.ok || band === LEAF_CHECK_BAND) return result;
  return ok({ ...result.value, clamp: { requestedBand: band, servedBand: LEAF_CHECK_BAND } });
}

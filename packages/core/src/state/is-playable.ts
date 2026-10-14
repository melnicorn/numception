import type { NodeId } from '../generator/node-id';
import { childrenOf } from '../rounds/round-node-id';
import { isNodeSolved } from './is-node-solved';
import type { Round } from './round';

/**
 * Whether `node` of `round` can be played as a puzzle: a leaf, or a node whose
 * children are all solved (its cells are their answers). Anything else is shown
 * as an overview of its children (FR-9, AD-25).
 */
export function isPlayable(round: Pick<Round, 'solved' | 'plan'>, node: NodeId): boolean {
  return node.tier === 1 || childrenOf(node, round.plan.n).every((child) => isNodeSolved(round, child));
}

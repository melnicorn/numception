import type { NodeId } from '../generator/node-id';
import { playOrder } from '../rounds/play-order';
import { isNodeSolved } from './is-node-solved';
import type { Round } from './round';

/**
 * The puzzle a solve auto-advances to (AD-25): the first unsolved node in play
 * order (`playOrder`, breadth-first), or undefined once the top is solved. It is
 * always playable: every node before it, so all its children, is solved.
 */
export function nextUnsolved(round: Pick<Round, 'solved' | 'plan'>): NodeId | undefined {
  return playOrder(round.plan.tiers, round.plan.n).find((node) => !isNodeSolved(round, node));
}

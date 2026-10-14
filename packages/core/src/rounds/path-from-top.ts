import type { NodeId } from '../generator/node-id';
import { parentOf } from './round-node-id';

/**
 * The `viewPath` that shows `node` (AD-25): the NodeId stack from the top of a
 * `tiers`-tier round down to `node`, top first. Callers pass a node of the round.
 */
export function pathFromTop(node: NodeId, tiers: number, n: number): NodeId[] {
  const path: NodeId[] = [node];
  let at = node;
  while (at.tier < tiers) {
    at = parentOf(at, n).parent;
    path.unshift(at);
  }
  return path;
}

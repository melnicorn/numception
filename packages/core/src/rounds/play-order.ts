import type { NodeId } from '../generator/node-id';
import { tierWidth } from './round-node-id';

/**
 * The order a round's puzzles are played in (epic Notes: breadth-first): every
 * leaf in index order, then each higher tier in index order, the top last. Classic
 * n = 3 is leaves 0..2 then the top; Tower n = 3 is leaves 0..8, tier 2 0..2, the top.
 */
export function playOrder(tiers: number, n: number): NodeId[] {
  const order: NodeId[] = [];
  for (let tier = 1; tier <= tiers; tier += 1) {
    const width = tierWidth(tiers, tier, n);
    for (let index = 0; index < width; index += 1) order.push({ tier, index });
  }
  return order;
}

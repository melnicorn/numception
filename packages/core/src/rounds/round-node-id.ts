// NodeId arithmetic for rounds (AD-4): bottom-anchored ids, tier 1 holds the
// leaves, and the children of (k, i) are (k − 1, i·n … i·n + n − 1). Integer-only.
import type { NodeId } from '../generator/node-id';

/** The top node of a round with `tiers` tiers: `(tiers, 0)`. */
export function topNodeId(tiers: number): NodeId {
  return { tier: tiers, index: 0 };
}

/** How many nodes tier `tier` of a `tiers`-tier round holds: n^(tiers − tier). */
export function tierWidth(tiers: number, tier: number, n: number): number {
  let width = 1;
  for (let k = tier; k < tiers; k += 1) width *= n;
  return width;
}

/** Nodes in a `tiers`-tier round: 1 + n + … + n^(tiers − 1) (Classic n + 1, Tower n² + n + 1). */
export function nodeCount(tiers: number, n: number): number {
  let count = 0;
  for (let tier = 1; tier <= tiers; tier += 1) count += tierWidth(tiers, tier, n);
  return count;
}

/** Child `j` (cell `j` in placement order) of `(k, i)`: `(k − 1, i·n + j)`. Callers pass k >= 2. */
export function childNodeId(parent: NodeId, n: number, j: number): NodeId {
  return { tier: parent.tier - 1, index: parent.index * n + j };
}

/** The n children of `(k, i)`, in cell order. Callers pass k >= 2. */
export function childrenOf(parent: NodeId, n: number): NodeId[] {
  return Array.from({ length: n }, (_, j) => childNodeId(parent, n, j));
}

/** The parent of `(k, i)` and the cell of the parent it fills: `((k + 1, ⌊i / n⌋), i mod n)`. */
export function parentOf(node: NodeId, n: number): { readonly parent: NodeId; readonly cell: number } {
  const cell = node.index % n;
  return { parent: { tier: node.tier + 1, index: (node.index - cell) / n }, cell };
}

/** Whether `node` is a well-formed id inside a `tiers`-tier round of n cells per puzzle. */
export function isInRound(node: unknown, tiers: number, n: number): node is NodeId {
  if (typeof node !== 'object' || node === null) return false;
  const { tier, index } = node as Record<string, unknown>;
  return (
    typeof tier === 'number' &&
    typeof index === 'number' &&
    Number.isInteger(tier) &&
    Number.isInteger(index) &&
    tier >= 1 &&
    tier <= tiers &&
    index >= 0 &&
    index < tierWidth(tiers, tier, n)
  );
}

/** Top-down order: higher tiers first, then by index. */
export function compareTopDown(x: NodeId, y: NodeId): number {
  return x.tier !== y.tier ? y.tier - x.tier : x.index - y.index;
}

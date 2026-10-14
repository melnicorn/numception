import type { NodeId } from '../generator/node-id';

/** Whether `b` names the same node as `a` (`b` may be untrusted command input). */
export function sameNode(a: NodeId, b: unknown): boolean {
  if (typeof b !== 'object' || b === null) return false;
  const { tier, index } = b as Record<string, unknown>;
  return a.tier === tier && a.index === index;
}

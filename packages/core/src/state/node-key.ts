import type { NodeId } from '../generator/node-id';

/** A node's key in `Round.puzzles` and `Round.solved`: `"<tier>.<index>"`. */
export type NodeKey = string;

/** The `NodeKey` of `node`. */
export function nodeKey(node: NodeId): NodeKey {
  return `${node.tier}.${node.index}`;
}

import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import { nodeKey } from './node-key';
import type { Round } from './round';

/** The puzzle at `node` of `round`: a realised leaf, or an upper-tier puzzle from the plan; undefined when not realised yet. */
export function roundPuzzle(round: Round, node: NodeId): Puzzle | undefined {
  if (node.tier === 1) return round.puzzles[nodeKey(node)];
  return round.plan.nodes.find((x) => x.nodeId.tier === node.tier && x.nodeId.index === node.index)?.puzzle;
}

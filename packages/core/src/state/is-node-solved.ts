import type { NodeId } from '../generator/node-id';
import { nodeKey } from './node-key';
import type { Round } from './round';

/** Whether `node` of `round` is solved. */
export function isNodeSolved(round: Pick<Round, 'solved'>, node: NodeId): boolean {
  return round.solved.includes(nodeKey(node));
}

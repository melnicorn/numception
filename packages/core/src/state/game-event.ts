import type { NodeId } from '../generator/node-id';
import type { DomainErrorCode } from '../result/domain-error';

/**
 * Something that happened (AD-2), past tense. Adapters react to these; they never
 * decide outcomes themselves.
 *
 * - `CommandRejected`: the command could not run (bad context, a tap on a puzzle
 *   not in view, a round that could not be planned); the state is unchanged.
 */
export type GameEvent =
  | { readonly type: 'ProfileCreated'; readonly profileId: string }
  | { readonly type: 'RoundStarted'; readonly roundId: string; readonly roundOrdinal: number }
  | { readonly type: 'PuzzleSolved'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number }
  | { readonly type: 'WrongTap'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number }
  | { readonly type: 'SoftMiss'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number }
  | { readonly type: 'RoundCompleted'; readonly roundId: string; readonly roundOrdinal: number }
  | { readonly type: 'CommandRejected'; readonly command: string; readonly code: DomainErrorCode; readonly message: string };

import type { NodeId } from '../generator/node-id';
import type { PresentationKind } from '../presentation/presentation';
import type { DomainErrorCode } from '../result/domain-error';

/**
 * Something that happened (AD-2), past tense. Adapters react to these; they never
 * decide outcomes themselves.
 *
 * - `PuzzleSolved`, `WrongTap`, `SoftMiss`: a tap's verdict, with `responseMs`, the
 *   Tick time from the puzzle becoming idle and shown to the tap (AD-20).
 * - `RoundCollapsed`: a completed group started collapsing into `nodeId`.
 * - `RoundCompleted`: the round's top was solved; `RoundStarted` follows.
 * - `InputDropped`: input that arrived during a beat (`presentation`) and was
 *   dropped, changing nothing (telemetry only, AD-20).
 * - `CommandRejected`: the command could not run (bad context, a tap on a puzzle
 *   not in view, a round that could not be planned); the state is unchanged.
 */
export type GameEvent =
  | { readonly type: 'ProfileCreated'; readonly profileId: string }
  | { readonly type: 'RoundStarted'; readonly roundId: string; readonly roundOrdinal: number }
  | { readonly type: 'PuzzleSolved'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number; readonly responseMs: number }
  | { readonly type: 'WrongTap'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number; readonly responseMs: number }
  | { readonly type: 'SoftMiss'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number; readonly responseMs: number }
  | { readonly type: 'RoundCollapsed'; readonly roundId: string; readonly nodeId: NodeId }
  | { readonly type: 'RoundCompleted'; readonly roundId: string; readonly roundOrdinal: number }
  | { readonly type: 'InputDropped'; readonly command: string; readonly presentation: PresentationKind }
  | { readonly type: 'CommandRejected'; readonly command: string; readonly code: DomainErrorCode; readonly message: string };

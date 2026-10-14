import type { NodeId } from '../generator/node-id';
import type { PresentationKind } from '../presentation/presentation';
import type { DomainErrorCode } from '../result/domain-error';
import type { SettingChange } from '../settings/setting-change';
import type { PauseReason } from './pause-reason';

/**
 * Something that happened (AD-2), past tense. Adapters react to these; they never
 * decide outcomes themselves.
 *
 * - `PuzzleSolved`, `WrongTap`, `SoftMiss`: a tap's verdict, with `responseMs`, the
 *   Tick time from the puzzle becoming idle and shown to the tap (AD-20).
 * - `RoundCollapsed`: a completed group started collapsing into `nodeId`.
 * - `RoundCompleted`: the round's top was solved; `RoundStarted` follows.
 * - `InputDropped`: input that arrived during a beat (`presentation`), or while
 *   paused (`pauseReasons`), and was dropped, changing nothing (telemetry only, AD-20).
 * - `Paused` / `Resumed`: a pause reason was added / removed (AD-17); `pauseReasons`
 *   is the set after it.
 * - `BlurCleared`: the first input after a lifecycle pause lifted the veil and did
 *   nothing else: no verdict, no response (AD-17).
 * - `SettingChanged`: a `SetSetting` changed the active profile's setting `key` to `value`.
 * - `CommandRejected`: the command could not run (bad context, a tap on a puzzle
 *   not in view, a round that could not be planned); the state is unchanged.
 */
export type GameEvent =
  | { readonly type: 'ProfileCreated'; readonly profileId: string }
  | { readonly type: 'RoundStarted'; readonly roundId: string; readonly roundOrdinal: number; readonly transitionId: string }
  | { readonly type: 'PuzzleSolved'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number; readonly responseMs: number }
  | { readonly type: 'WrongTap'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number; readonly responseMs: number }
  | { readonly type: 'SoftMiss'; readonly roundId: string; readonly nodeId: NodeId; readonly cellIndex: number; readonly responseMs: number }
  | { readonly type: 'RoundCollapsed'; readonly roundId: string; readonly nodeId: NodeId }
  | { readonly type: 'RoundCompleted'; readonly roundId: string; readonly roundOrdinal: number }
  | { readonly type: 'InputDropped'; readonly command: string; readonly presentation: PresentationKind; readonly pauseReasons?: readonly PauseReason[] }
  | { readonly type: 'Paused'; readonly reason: PauseReason; readonly pauseReasons: readonly PauseReason[] }
  | { readonly type: 'Resumed'; readonly reason: PauseReason; readonly pauseReasons: readonly PauseReason[] }
  | { readonly type: 'BlurCleared' }
  | ({ readonly type: 'SettingChanged'; readonly profileId: string } & SettingChange)
  | { readonly type: 'CommandRejected'; readonly command: string; readonly code: DomainErrorCode; readonly message: string };

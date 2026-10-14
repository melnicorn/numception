import type { NodeId } from '../generator/node-id';
import type { GameState } from './game-state';
import type { PauseReason } from './pause-reason';

/**
 * A command (AD-2): serialisable and imperative. This build's play loop:
 *
 * - `StartSession`: creates the default Kid profile when none exists, and starts a
 *   round when the profile has none active. With `restore` (a game loaded from a
 *   save, `parseSave`), that game becomes the active profile and its saved round
 *   continues, any beat it was saved in completed (AD-20); no profile or round is
 *   created when it has one.
 * - `TapCell`: a tap on cell `cellIndex` (placement order) of the puzzle `nodeId`.
 * - `EnterPuzzle`: enters the puzzle `nodeId` from the overview of its parent (FR-9, AD-25).
 * - `ZoomOut`: from the puzzle in view to the overview of its parent (AD-25).
 * - `Tick`: `elapsedMs` of play time passed (AD-17); the only thing that advances
 *   the presentation timeline (AD-20). A non-negative integer.
 * - `Pause` / `Resume`: add / remove a pause reason (AD-17). `Pause` completes any
 *   running beat to its end state; `Pause { lifecycle }` also sets `blur`.
 */
export type Command =
  | { readonly type: 'StartSession'; readonly restore?: GameState }
  | { readonly type: 'TapCell'; readonly nodeId: NodeId; readonly cellIndex: number }
  | { readonly type: 'EnterPuzzle'; readonly nodeId: NodeId }
  | { readonly type: 'ZoomOut' }
  | { readonly type: 'Tick'; readonly elapsedMs: number }
  | { readonly type: 'Pause'; readonly reason: PauseReason }
  | { readonly type: 'Resume'; readonly reason: PauseReason };

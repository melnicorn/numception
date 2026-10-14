import type { NodeId } from '../generator/node-id';

/**
 * A command (AD-2): serialisable and imperative. This build's play loop:
 *
 * - `StartSession`: creates the default Kid profile when none exists, and starts a
 *   round when the profile has none active.
 * - `TapCell`: a tap on cell `cellIndex` (placement order) of the puzzle `nodeId`.
 * - `EnterPuzzle`: enters the puzzle `nodeId` from the overview of its parent (FR-9, AD-25).
 * - `ZoomOut`: from the puzzle in view to the overview of its parent (AD-25).
 * - `Tick`: `elapsedMs` of play time passed (AD-17); the only thing that advances
 *   the presentation timeline (AD-20). A non-negative integer.
 */
export type Command =
  | { readonly type: 'StartSession' }
  | { readonly type: 'TapCell'; readonly nodeId: NodeId; readonly cellIndex: number }
  | { readonly type: 'EnterPuzzle'; readonly nodeId: NodeId }
  | { readonly type: 'ZoomOut' }
  | { readonly type: 'Tick'; readonly elapsedMs: number };

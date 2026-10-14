import type { NodeId } from '../generator/node-id';

/**
 * A command (AD-2): serialisable and imperative. This build's play loop:
 *
 * - `StartSession`: creates the default Kid profile when none exists, and starts a
 *   round when the profile has none active.
 * - `TapCell`: a tap on cell `cellIndex` (placement order) of the puzzle `nodeId`.
 */
export type Command =
  | { readonly type: 'StartSession' }
  | { readonly type: 'TapCell'; readonly nodeId: NodeId; readonly cellIndex: number };

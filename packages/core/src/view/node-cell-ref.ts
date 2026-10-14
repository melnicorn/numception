import type { NodeId } from '../generator/node-id';

/** A cell of a puzzle: what a tap resolves to (AD-14), and what `TapCell` carries. */
export type NodeCellRef = { readonly nodeId: NodeId; readonly cellIndex: number };

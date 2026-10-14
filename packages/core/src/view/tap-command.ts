import type { Command } from '../state/command';
import type { NodeCellRef } from './node-cell-ref';
import type { PlayVM } from './play-vm';

/**
 * The command a tap on cell `ref` of `vm` means (FR-9, AD-25): in a puzzle view,
 * `TapCell`; in an overview, `EnterPuzzle` for an enterable cell, else nothing.
 * Null while `vm.inputLocked` (the tap would be dropped) or for a ref of another view.
 */
export function tapCommand(vm: PlayVM, ref: NodeCellRef): Command | null {
  if (vm.inputLocked || vm.nodeId.tier !== ref.nodeId.tier || vm.nodeId.index !== ref.nodeId.index) return null;
  if (vm.kind === 'puzzle') return { type: 'TapCell', nodeId: ref.nodeId, cellIndex: ref.cellIndex };
  const enters = vm.cells[ref.cellIndex]?.enters ?? null;
  return enters === null ? null : { type: 'EnterPuzzle', nodeId: enters };
}

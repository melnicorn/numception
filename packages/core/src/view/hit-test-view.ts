import { hitTest } from '../layout/hit-test';
import type { LayoutPoint } from '../layout/shape-layout';
import { SHAPES } from '../layout/shapes/shapes';
import type { NodeCellRef } from './node-cell-ref';
import type { PlayVM } from './play-vm';

/**
 * The cell of `vm` under `point` (unit-box coordinates), or null (FR-8, AD-14):
 * null while `vm.inputLocked`, outside the shape, on the operator, or within
 * `edgeTolerance` (in units of the drawn height, see `hitTest`) of a shared edge.
 */
export function hitTestView(vm: PlayVM, point: LayoutPoint, edgeTolerance: number): NodeCellRef | null {
  if (vm.inputLocked) return null;
  const layout = SHAPES[vm.shapeId];
  if (layout === undefined) return null;
  const cellIndex = hitTest(layout, point, edgeTolerance);
  return cellIndex === null ? null : { nodeId: vm.nodeId, cellIndex };
}

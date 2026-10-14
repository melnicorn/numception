import type { NodeId } from '../generator/node-id';
import type { LayoutPoint, LayoutPolygon } from '../layout/shape-layout';
import type { ShapeId } from '../layout/shape-id';
import type { KilnTokens } from './kiln-tokens';

/** One cell as the play view draws it. Geometry is in the layout's unit box (`core/layout`). */
export type PlayCellVM = {
  readonly index: number;
  readonly polygon: LayoutPolygon;
  readonly labelPoint: LayoutPoint;
  readonly inscribedRadius: number;
  /** The numeral, from `displayValue` (AD-5). */
  readonly text: string;
  readonly state: 'unsolved' | 'solved';
};

/**
 * The play view (AD-13): the puzzle in view, ready to draw. Adapters read only
 * this; every rule decision is an explicit field (`inputLocked`, cell `state`).
 */
export type PlayVM = {
  readonly nodeId: NodeId;
  readonly shapeId: ShapeId;
  /** Width / height of the drawn unit box. */
  readonly aspect: number;
  readonly cells: readonly PlayCellVM[];
  readonly operator: { readonly polygon: LayoutPolygon; readonly labelPoint: LayoutPoint; readonly symbol: string };
  readonly inputLocked: boolean;
  readonly theme: KilnTokens;
};

import type { NodeId } from '../generator/node-id';
import type { LayoutPoint, LayoutPolygon } from '../layout/shape-layout';
import type { ShapeId } from '../layout/shape-id';
import type { PresentationKind } from '../presentation/presentation';
import type { KilnTokens } from './kiln-tokens';

/** One cell as the play view draws it. Geometry is in the layout's unit box (`core/layout`). */
export type PlayCellVM = {
  readonly index: number;
  readonly polygon: LayoutPolygon;
  readonly labelPoint: LayoutPoint;
  readonly inscribedRadius: number;
  /** The numeral, from `displayValue` (AD-5); empty for an overview cell whose puzzle is unsolved. */
  readonly text: string;
  /** In a puzzle view, upper-tier cells whose child is solved; in an overview, cells whose child is solved. */
  readonly state: 'unsolved' | 'solved';
  /** In an overview, the child puzzle a tap on this cell enters (`EnterPuzzle`), or null; always null in a puzzle view. */
  readonly enters: NodeId | null;
};

/**
 * The presentation beat running (AD-20) as render reads it: `progress` runs 0..1
 * over `durationMs` of Tick time, so render can interpolate (AD-14). Idle is 1:
 * render snaps to the end state.
 */
export type PresentationVM = {
  readonly kind: PresentationKind;
  readonly progress: number;
  readonly durationMs: number;
  readonly transitionId: string;
};

/**
 * The play view (AD-13), ready to draw. Adapters read only this; every rule
 * decision is an explicit field (`kind`, cell `state` and `enters`, `inputLocked`).
 *
 * - `kind`: `puzzle` (tap a cell to answer, `TapCell`) or `overview` (the node's
 *   children as cells; tap an enterable one to enter it, `EnterPuzzle`). Both use
 *   the same geometry.
 * - `inputLocked`: a beat is running; taps are dropped, so `hitTest` is null.
 */
export type PlayVM = {
  readonly nodeId: NodeId;
  readonly kind: 'puzzle' | 'overview';
  readonly shapeId: ShapeId;
  /** Width / height of the drawn unit box. */
  readonly aspect: number;
  readonly cells: readonly PlayCellVM[];
  readonly operator: { readonly polygon: LayoutPolygon; readonly labelPoint: LayoutPoint; readonly symbol: string };
  readonly inputLocked: boolean;
  readonly presentation: PresentationVM;
  readonly theme: KilnTokens;
};

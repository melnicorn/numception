import type { NodeId } from '../generator/node-id';
import type { LayoutPoint, LayoutPolygon } from '../layout/shape-layout';
import type { ShapeId } from '../layout/shape-id';
import type { PresentationKind } from '../presentation/presentation';
import type { CameraRect } from './camera-rect';
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
 * The camera of a moving beat (`advance`, `collapse`), in the unit box of its
 * `to` view: render fits `from` into the frame at progress 0 and `to` at 1
 * (`to` is always the whole shape's bounding box, the idle camera). The `from`
 * view is drawn with its whole shape's bounding box at `from`, so at progress 0
 * it fills the frame exactly as it did at idle.
 */
export type CameraVM = { readonly from: CameraRect; readonly to: CameraRect };

/**
 * The presentation beat running (AD-20) as render reads it: `progress` runs 0..1
 * over `durationMs` of Tick time, so render can interpolate (AD-14). Idle is 1:
 * render snaps to the end state.
 *
 * What each beat needs to be drawn (absent at idle and in nested views):
 * - `solve`: `cellIndex`, the tapped answer cell of the view (it fires at once).
 * - `advance`: `from` (the puzzle left, fused into its answer when it was just
 *   solved), `to` (the next puzzle, as the outer view) and `camera`: a straight
 *   pan and zoom between the two inside their shared ancestors' geometry.
 * - `collapse`: `from` (the solved child, fused), `to` (the parent it collapsed
 *   into) and `cellIndex`, the cell of `to` the child fills; `camera.from` is the
 *   child's frame inside that cell.
 * - `roundStart`: `from` (the last round's solved top, fused) and `to` (the new
 *   round's first puzzle) for the crossfade; no camera.
 */
export type PresentationVM = {
  readonly kind: PresentationKind;
  readonly progress: number;
  readonly durationMs: number;
  readonly transitionId: string;
  readonly cellIndex: number | null;
  readonly from?: PlayVM;
  readonly to?: PlayVM;
  readonly camera?: CameraVM;
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
  /**
   * When the node in view is itself solved, its answer cell: render draws the
   * puzzle fused into that answer (DESIGN round-collapse). Null otherwise.
   */
  readonly solvedAnswer: number | null;
  readonly inputLocked: boolean;
  readonly presentation: PresentationVM;
  readonly theme: KilnTokens;
};

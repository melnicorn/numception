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
 * `to` view: render fits `from` into the frame at progress 0 and `to` at 1. Both
 * are idle framings (`core/view/camera-rect` `idleCamera`): a view's whole shape
 * box, or, when it has a `context`, its context camera, so a beat starts and lands
 * exactly where idle is. `fromBox` is where the `from` view's whole shape box sits
 * in the `to` view's unit box (render nests `from` there).
 */
export type CameraVM = { readonly from: CameraRect; readonly to: CameraRect; readonly fromBox: CameraRect };

/**
 * The super-shape around a puzzle (entry 9), present when the node in view has a
 * parent:
 * - `parent`: the parent drawn as an overview (solved cells show their answers,
 *   unsolved ones are empty tiles; no `enters`, no context of its own);
 * - `cellIndex`: the cell of `parent` the node in view fills;
 * - `camera`: the region of the parent's unit box render fits to the frame (the
 *   cell's box grown so the cell takes about 75 % of it, `CONTEXT_CELL_SHARE`).
 *   The node in view is drawn in its cell; the parent and siblings run off the
 *   frame's edges.
 */
export type PlayContextVM = { readonly parent: PlayVM; readonly cellIndex: number; readonly camera: CameraRect };

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
 *   child's idle framing inside that cell.
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
  /** The parent drawn around the node in view (`PlayContextVM`); absent for the round's top. */
  readonly context?: PlayContextVM;
};

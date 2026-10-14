import type { LayoutPoint, ShapeLayout } from '../layout/shape-layout';

/**
 * A rectangle of a view's unit box (`core/layout`: x and y in 0..1, x not yet
 * scaled by the layout's `aspect`). As a camera it is the region render fits into
 * the frame, the way it fits the whole shape's bounding box at idle.
 */
export type CameraRect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

/**
 * A similarity in drawn units (x scaled by `aspect`, y as is): `p ↦ k·p + (tx, ty)`.
 * Nesting maps a child's drawn box into its parent's this way.
 */
type Similarity = { readonly k: number; readonly tx: number; readonly ty: number };

const IDENTITY: Similarity = { k: 1, tx: 0, ty: 0 };

/**
 * How much of the frame the puzzle in view takes when its parent (the
 * super-shape) is drawn around it (entry 9): its cell's bounding box is grown
 * about its centre by `1 / CONTEXT_CELL_SHARE` to make the camera, so render's fit
 * gives the cell 75 % of the limiting frame dimension (less the gutter): the
 * width on a portrait phone, the height in a wide window, the shorter one either
 * way. At 390 × 844 a 3A leaf's cells then keep an inscribed circle of about
 * 77 pt, above DESIGN's Kid floor (56).
 */
export const CONTEXT_CELL_SHARE = 0.75;

/** The bounding box of `points` (unit box), or the whole box when empty. */
export function boundsOf(points: readonly LayoutPoint[]): CameraRect {
  if (points.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x: x0, y: y0, width: Math.max(...xs) - x0, height: Math.max(...ys) - y0 };
}

/** The bounding box of the whole shape, cells and operator: the idle camera (render's `fitView`). */
export function contentBox(layout: ShapeLayout): CameraRect {
  return boundsOf([...layout.cells.flatMap((c) => c.polygon), ...layout.operator.polygon]);
}

function drawn(rect: CameraRect, aspect: number): CameraRect {
  return { x: rect.x * aspect, y: rect.y, width: rect.width * aspect, height: rect.height };
}

function unit(rect: CameraRect, aspect: number): CameraRect {
  return { x: rect.x / aspect, y: rect.y, width: rect.width / aspect, height: rect.height };
}

/** The similarity that fits drawn box `inner` into drawn box `outer`, centred, keeping its proportions. */
function fitInto(inner: CameraRect, outer: CameraRect): Similarity {
  const k = Math.min(outer.width / Math.max(inner.width, 1e-9), outer.height / Math.max(inner.height, 1e-9));
  return {
    k,
    tx: outer.x + outer.width / 2 - k * (inner.x + inner.width / 2),
    ty: outer.y + outer.height / 2 - k * (inner.y + inner.height / 2),
  };
}

function compose(outer: Similarity, inner: Similarity): Similarity {
  return { k: outer.k * inner.k, tx: outer.k * inner.tx + outer.tx, ty: outer.k * inner.ty + outer.ty };
}

function invert(s: Similarity): Similarity {
  return { k: 1 / s.k, tx: -s.tx / s.k, ty: -s.ty / s.k };
}

function apply(s: Similarity, rect: CameraRect): CameraRect {
  return { x: s.k * rect.x + s.tx, y: s.k * rect.y + s.ty, width: s.k * rect.width, height: s.k * rect.height };
}

/**
 * The context camera of a puzzle that fills cell `cell` of its parent (entry 9),
 * in the parent's unit box: the cell's bounding box grown about its centre by
 * `1 / CONTEXT_CELL_SHARE`, so the parent's outline and the sibling cells show
 * around the puzzle and run off the frame's edges.
 */
export function contextCamera(layout: ShapeLayout, cell: number): CameraRect {
  const box = boundsOf(layout.cells[cell]?.polygon ?? []);
  const width = box.width / CONTEXT_CELL_SHARE;
  const height = box.height / CONTEXT_CELL_SHARE;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

/**
 * Where a child puzzle sits inside cell `cell` of its parent (drawn units of the
 * parent): its whole shape's box fitted into the cell polygon's bounding box,
 * centred. A cell that becomes the child (FR-9; 3A) has the child's outline, so
 * the box is the polygon; a "contains" cell (n ≥ 5, not served yet) gets the
 * bounding-box frame, which is enough there.
 */
function childInCell(layout: ShapeLayout, cell: number): Similarity {
  const polygon = layout.cells[cell]?.polygon ?? [];
  return fitInto(drawn(contentBox(layout), layout.aspect), drawn(boundsOf(polygon), layout.aspect));
}

/**
 * The frame of a node in the round's top puzzle (drawn units of the top), from
 * the cells it nests in: `cellPath` is the child cell taken at each tier from the
 * top down (empty for the top). Every tier of a round uses `layout`.
 */
function frameInTop(layout: ShapeLayout, cellPath: readonly number[]): Similarity {
  return cellPath.reduce((frame, cell) => compose(frame, childInCell(layout, cell)), IDENTITY);
}

/**
 * The camera rect, in the unit box of the node reached by `toPath`, that shows the
 * whole shape of the node reached by `fromPath` (both cell paths from the round's
 * top, see `frameInTop`): where the `from` view sits relative to the `to` view.
 */
export function relativeCamera(layout: ShapeLayout, fromPath: readonly number[], toPath: readonly number[]): CameraRect {
  const toTop = frameInTop(layout, toPath);
  const fromTop = frameInTop(layout, fromPath);
  const fromInTo = compose(invert(toTop), fromTop);
  return unit(apply(fromInTo, drawn(contentBox(layout), layout.aspect)), layout.aspect);
}

/**
 * The idle camera of the node reached by `viewPath` (its whole shape when it is
 * the round's top, else its `contextCamera` in its parent), as a rect of the unit
 * box of the node reached by `toPath`: what a moving beat fits to the frame at
 * either end so it starts and lands on the idle framing (cell paths as for
 * `relativeCamera`).
 */
export function idleCamera(layout: ShapeLayout, viewPath: readonly number[], toPath: readonly number[]): CameraRect {
  const last = viewPath[viewPath.length - 1];
  const inTop =
    last === undefined
      ? drawn(contentBox(layout), layout.aspect)
      : apply(frameInTop(layout, viewPath.slice(0, -1)), drawn(contextCamera(layout, last), layout.aspect));
  return unit(apply(invert(frameInTop(layout, toPath)), inTop), layout.aspect);
}

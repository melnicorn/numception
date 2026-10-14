import type { ShapeId } from './shape-id';

/**
 * A point in a layout's unit box `[0,1]×[0,1]`. Screen convention: x grows right,
 * y grows **down**, so (0.5, 0) is 12 o'clock. The box is normalised: the
 * renderer scales x by the layout's `aspect` (width / height). `inscribedRadius`
 * is in unit-box units before that scaling; with `aspect < 1`,
 * `inscribedRadius × aspect` is a safe on-screen bound (in units of the drawn
 * height). `hitTest` measures edge distance after the scaling, so its tolerance
 * is in units of the drawn height (see `hitTest`).
 */
export type LayoutPoint = readonly [x: number, y: number];

/**
 * A simple polygon, counter-clockwise **as seen on screen** (y down), so its
 * shoelace sum Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ) is negative. Curves are approximated by vertices.
 */
export type LayoutPolygon = readonly LayoutPoint[];

/**
 * One answer cell.
 * - `index`: 0..n − 1, the puzzle's cell placement order (`Puzzle.cells[index]`).
 * - `labelPoint`: where the numeral is centred; it lies inside `polygon` at
 *   least `inscribedRadius` from every edge (the largest circle there).
 * - `becomes`: the cell has the whole puzzle's general shape, so it becomes the
 *   next-tier puzzle (FR-9); otherwise the next tier is drawn inside it.
 */
export type CellGeometry = {
  readonly index: number;
  readonly polygon: LayoutPolygon;
  readonly labelPoint: LayoutPoint;
  readonly inscribedRadius: number;
  readonly becomes: boolean;
};

/** The operator space: always central, containing (0.5, 0.5); never an answer. */
export type OperatorGeometry = {
  readonly polygon: LayoutPolygon;
  readonly labelPoint: LayoutPoint;
  readonly inscribedRadius: number;
};

/**
 * Pure cell geometry for one shape (AD-13): `render` draws and hit-tests from it,
 * `ui` derives focus order and the accessible tree from it. Regions (cells and
 * operator) never overlap; they may share edges, which are tap no-ops (FR-8).
 * `nesting` is the shape-level rule from DESIGN.md; `becomes` per cell is exact.
 */
export type ShapeLayout = {
  readonly shapeId: ShapeId;
  readonly n: number;
  readonly aspect: number;
  readonly nesting: 'becomes' | 'contains';
  readonly cells: readonly CellGeometry[];
  readonly operator: OperatorGeometry;
};

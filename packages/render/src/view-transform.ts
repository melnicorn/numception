import type { LayoutPoint, PlayVM } from '@numception/app';

/** The space around the shape inside the mount element, CSS px (DESIGN `spacing.gutter`). */
export const GUTTER_PX = 16;

/**
 * How a view's unit box maps onto the mount element (CSS px): screen
 * `(left + x · aspect · scale, top + y · scale)`. `scale` is the drawn height of
 * the unit box in px, so a tolerance of `t` px is `t / scale` drawn-height units
 * (`core/layout` hitTest).
 */
export type ViewTransform = { readonly scale: number; readonly left: number; readonly top: number; readonly aspect: number };

/**
 * Fits the shape's bounding box (cells and operator, in drawn proportions) into
 * `width × height` less the gutter on every side, centred, keeping `vm.aspect`.
 */
export function fitView(vm: Pick<PlayVM, 'aspect' | 'cells' | 'operator'>, width: number, height: number, gutter = GUTTER_PX): ViewTransform {
  const points = [...vm.cells.flatMap((c) => c.polygon), ...vm.operator.polygon];
  const xs = points.map((p) => p[0] * vm.aspect);
  const ys = points.map((p) => p[1]);
  const [x0, x1] = points.length === 0 ? [0, vm.aspect] : [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = points.length === 0 ? [0, 1] : [Math.min(...ys), Math.max(...ys)];
  const availW = Math.max(0, width - 2 * gutter);
  const availH = Math.max(0, height - 2 * gutter);
  const bw = Math.max(x1 - x0, 1e-6);
  const bh = Math.max(y1 - y0, 1e-6);
  const scale = Math.max(Math.min(availW / bw, availH / bh), 1e-6);
  return {
    scale,
    aspect: vm.aspect,
    left: gutter + (availW - bw * scale) / 2 - x0 * scale,
    top: gutter + (availH - bh * scale) / 2 - y0 * scale,
  };
}

/** A unit-box point in mount-element px. */
export function toScreen(t: ViewTransform, p: LayoutPoint): LayoutPoint {
  return [t.left + p[0] * t.aspect * t.scale, t.top + p[1] * t.scale];
}

/** A mount-element px point in the unit box (inverse of `toScreen`). */
export function toUnit(t: ViewTransform, p: LayoutPoint): LayoutPoint {
  return [(p[0] - t.left) / (t.aspect * t.scale), (p[1] - t.top) / t.scale];
}

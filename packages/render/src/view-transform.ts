import type { CameraRect, LayoutPoint, PlayVM } from '@numception/app';

/** The space around the shape inside the mount element, CSS px (DESIGN `spacing.gutter`). */
export const GUTTER_PX = 16;

/**
 * How a view's unit box maps onto the mount element (CSS px): screen
 * `(left + x · aspect · scale, top + y · scale)`. `scale` is the drawn height of
 * the unit box in px, so a tolerance of `t` px is `t / scale` drawn-height units
 * (`core/layout` hitTest).
 */
export type ViewTransform = { readonly scale: number; readonly left: number; readonly top: number; readonly aspect: number };

/** The bounding box of the view's shape (cells and operator), in its unit box: the idle camera. */
export function shapeBox(vm: Pick<PlayVM, 'cells' | 'operator'>): CameraRect {
  const points = [...vm.cells.flatMap((c) => c.polygon), ...vm.operator.polygon];
  if (points.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x: x0, y: y0, width: Math.max(...xs) - x0, height: Math.max(...ys) - y0 };
}

/**
 * Fits `rect` of a unit box drawn at `aspect` into `width × height` less the
 * gutter on every side, centred, keeping proportions: the camera transform.
 */
export function fitRect(rect: CameraRect, aspect: number, width: number, height: number, gutter = GUTTER_PX): ViewTransform {
  const x0 = rect.x * aspect;
  const y0 = rect.y;
  const availW = Math.max(0, width - 2 * gutter);
  const availH = Math.max(0, height - 2 * gutter);
  const bw = Math.max(rect.width * aspect, 1e-6);
  const bh = Math.max(rect.height, 1e-6);
  const scale = Math.max(Math.min(availW / bw, availH / bh), 1e-6);
  return {
    scale,
    aspect,
    left: gutter + (availW - bw * scale) / 2 - x0 * scale,
    top: gutter + (availH - bh * scale) / 2 - y0 * scale,
  };
}

/**
 * Fits the shape's bounding box (cells and operator, in drawn proportions) into
 * `width × height` less the gutter on every side, centred, keeping `vm.aspect`.
 */
export function fitView(vm: Pick<PlayVM, 'aspect' | 'cells' | 'operator'>, width: number, height: number, gutter = GUTTER_PX): ViewTransform {
  return fitRect(shapeBox(vm), vm.aspect, width, height, gutter);
}

/**
 * The transform of a view nested in another: its shape box (`inner`, its own unit
 * box, drawn at `innerAspect`) fitted, centred, into `frame` of the outer view's
 * unit box, which `outer` puts on screen.
 */
export function nestTransform(outer: ViewTransform, frame: CameraRect, inner: CameraRect, innerAspect: number): ViewTransform {
  const fx = frame.x * outer.aspect;
  const fw = frame.width * outer.aspect;
  const ix = inner.x * innerAspect;
  const iw = Math.max(inner.width * innerAspect, 1e-9);
  const ih = Math.max(inner.height, 1e-9);
  const k = Math.min(fw / iw, frame.height / ih);
  const tx = fx + fw / 2 - k * (ix + iw / 2);
  const ty = frame.y + frame.height / 2 - k * (inner.y + ih / 2);
  return { scale: outer.scale * k, aspect: innerAspect, left: outer.left + outer.scale * tx, top: outer.top + outer.scale * ty };
}

/** A unit-box point in mount-element px. */
export function toScreen(t: ViewTransform, p: LayoutPoint): LayoutPoint {
  return [t.left + p[0] * t.aspect * t.scale, t.top + p[1] * t.scale];
}

/** A mount-element px point in the unit box (inverse of `toScreen`). */
export function toUnit(t: ViewTransform, p: LayoutPoint): LayoutPoint {
  return [(p[0] - t.left) / (t.aspect * t.scale), (p[1] - t.top) / t.scale];
}

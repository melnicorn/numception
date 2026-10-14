import type { LayoutPoint } from '@numception/app';
import { clamp01, easeOut, ramp } from './beat-motion';

// The soft-miss cue (FR-4, DESIGN `soft-miss`) as pure functions of the cue's
// `progress` (Tick time, AD-17): the tapped cell pulses once in place and a ghost
// arrow points from it to the answer. Never red, and nothing dims the board.

/** The pulse's peak: how much wider than `lineWidth` the outline swells, CSS px, and the fill wash's alpha. */
export const PULSE_SWELL_PX = 4;
export const PULSE_WASH_ALPHA = 0.22;
/** The ghost arrow's peak alpha, line width and arrowhead length (CSS px). */
export const ARROW_ALPHA = 0.55;
export const ARROW_WIDTH_PX = 3;
export const ARROW_HEAD_PX = 14;
/** The share of the label-to-label distance left clear at each end, so the arrow never covers a numeral. */
export const ARROW_INSET = 0.28;

/**
 * The pulse's strength at `p` (0..1): a single swell, rising (ease-out) over the
 * first 30 % and fading back to nothing by the end, so it reads as one pulse.
 */
export function pulseStrength(p: number): number {
  const t = clamp01(p);
  return t < 0.3 ? easeOut(t / 0.3) : 1 - ramp(t, 0.3, 1);
}

/** The pulsing cell's outline at `p`: its width (the theme's `lineWidth` swelled) and alpha, and its fill wash's alpha. */
export function pulseLook(p: number, lineWidth: number): { readonly width: number; readonly alpha: number; readonly washAlpha: number } {
  const s = pulseStrength(p);
  return { width: lineWidth + PULSE_SWELL_PX * s, alpha: s, washAlpha: PULSE_WASH_ALPHA * s };
}

/** The ghost arrow's alpha at `p`: quickly in (first 15 %), held, then faded out over the last half. */
export function arrowAlpha(p: number): number {
  const t = clamp01(p);
  return ARROW_ALPHA * ramp(t, 0, 0.15) * (1 - ramp(t, 0.5, 1));
}

/**
 * The ghost arrow from screen point `from` (the tapped cell's label point) toward
 * `to` (the answer's), CSS px: the shaft runs between the two with `ARROW_INSET`
 * of the distance left clear at each end, and the head is a chevron at `tip`, its
 * arms `ARROW_HEAD_PX` long at ±30° (shortened on a very short arrow). Null when
 * the points coincide.
 */
export function ghostArrow(
  from: LayoutPoint,
  to: LayoutPoint,
): { readonly tail: LayoutPoint; readonly tip: LayoutPoint; readonly left: LayoutPoint; readonly right: LayoutPoint } | null {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return null;
  const ux = dx / length;
  const uy = dy / length;
  const tail: LayoutPoint = [from[0] + ux * length * ARROW_INSET, from[1] + uy * length * ARROW_INSET];
  const tip: LayoutPoint = [to[0] - ux * length * ARROW_INSET, to[1] - uy * length * ARROW_INSET];
  const head = Math.min(ARROW_HEAD_PX, length * (1 - 2 * ARROW_INSET) * 0.5);
  const cos = Math.cos(Math.PI / 6);
  const sin = Math.sin(Math.PI / 6);
  // The arms point back from the tip, the shaft direction rotated by ±30°.
  const arm = (s: number): LayoutPoint => [tip[0] - head * (ux * cos - s * uy * sin), tip[1] - head * (uy * cos + s * ux * sin)];
  return { tail, tip, left: arm(1), right: arm(-1) };
}

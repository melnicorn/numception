import type { ThemeTokens } from '@numception/app';
import type { ViewTransform } from './view-transform';

/** The DESIGN reference frame width the hero sizes are given for. */
const REFERENCE_WIDTH_PX = 375;
/** Numerals take about this share of the cell's inscribed radius. */
const RADIUS_SHARE = 1.1;
/** DESIGN `typography.number-floor`. */
const FLOOR_PX = 20;
/** DESIGN `numeral-min-weight`: below this size a numeral is at least 400. */
const LIGHT_MIN_PX = 32;

/** A numeral's weight at `fontSizePx`: the theme's, raised to 400 below 32 px (DESIGN numeral-min-weight). */
export function numeralWeight(weight: ThemeTokens['fontWeight'], fontSizePx: number): ThemeTokens['fontWeight'] {
  return fontSizePx < LIGHT_MIN_PX && Number(weight) < 400 ? '400' : weight;
}

/**
 * The numeral size for a cell of inscribed radius `inscribedRadius` (unit box) in
 * a frame `frameWidth` px wide: about 1.1 × the on-screen radius, capped by the
 * theme's hero size scaled with the frame beyond 375 px (44 px at n = 3 on a
 * phone), never below 20 px.
 */
export function numeralSize(theme: Pick<ThemeTokens, 'numberSizePx'>, t: ViewTransform, inscribedRadius: number, frameWidth: number): number {
  const radiusPx = inscribedRadius * Math.min(1, t.aspect) * t.scale;
  const cap = theme.numberSizePx * Math.max(1, frameWidth / REFERENCE_WIDTH_PX);
  return Math.max(FLOOR_PX, Math.min(RADIUS_SHARE * radiusPx, cap));
}

/**
 * The transform a layer's numerals are sized from. An advance can change the
 * scale a lot (a Tower tier-2 puzzle to the next group's first leaf is about 2–3×),
 * so its layers size numerals from where they are on screen now (`current`) and
 * stay in proportion to their tiles. A collapse keeps the rest size (`rest`):
 * its answers ease 58 → 44 px in screen space as the camera pulls out (DESIGN
 * round-collapse), and other beats do not move the camera.
 */
export function sizingTransform(current: ViewTransform, rest: ViewTransform, followCamera: boolean): ViewTransform {
  return followCamera ? current : rest;
}

/**
 * A sizing transform between `a` and `b` (only the scale matters for sizing),
 * geometric in `t`: a collapse's parent starts with the numeral sizes its context
 * drawing had around the child and settles to its own rest sizes (entry 9).
 */
export function blendScale(a: ViewTransform, b: ViewTransform, t: number): ViewTransform {
  const u = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return { ...b, scale: a.scale * (b.scale / a.scale) ** u };
}

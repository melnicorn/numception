import type { KilnTokens } from '@numception/app';
import type { ViewTransform } from './view-transform';

/** The DESIGN reference frame width the hero sizes are given for. */
const REFERENCE_WIDTH_PX = 375;
/** Numerals take about this share of the cell's inscribed radius. */
const RADIUS_SHARE = 1.1;
/** DESIGN `typography.number-floor`. */
const FLOOR_PX = 20;

/**
 * The numeral size for a cell of inscribed radius `inscribedRadius` (unit box) in
 * a frame `frameWidth` px wide: about 1.1 × the on-screen radius, capped by the
 * theme's hero size scaled with the frame beyond 375 px (44 px at n = 3 on a
 * phone), never below 20 px.
 */
export function numeralSize(theme: Pick<KilnTokens, 'numberSizePx'>, t: ViewTransform, inscribedRadius: number, frameWidth: number): number {
  const radiusPx = inscribedRadius * Math.min(1, t.aspect) * t.scale;
  const cap = theme.numberSizePx * Math.max(1, frameWidth / REFERENCE_WIDTH_PX);
  return Math.max(FLOOR_PX, Math.min(RADIUS_SHARE * radiusPx, cap));
}

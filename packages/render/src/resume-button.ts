import type { LayoutPoint } from '@numception/app';

/**
 * The resume affordance on a veiled board (AD-17): a play button centred on the
 * frame, so the veil reads as "paused, tap to continue" rather than "disabled"
 * (playtest feedback 2026-10-14). Numbers are the only text on the play view
 * (DESIGN), so it is a glyph, not words. Any tap anywhere still lifts the veil.
 */
export type ResumeButtonGeometry = {
  readonly center: LayoutPoint;
  readonly radius: number;
  /** The play triangle, pointing right, optically centred in the circle. */
  readonly triangle: readonly [LayoutPoint, LayoutPoint, LayoutPoint];
};

/** Radius as a share of the frame's shorter side, with a floor so it stays a comfortable target. */
export const RESUME_RADIUS_SHARE = 0.11;
export const RESUME_MIN_RADIUS_PX = 36;

export function resumeButton(width: number, height: number): ResumeButtonGeometry {
  const radius = Math.max(RESUME_MIN_RADIUS_PX, Math.min(width, height) * RESUME_RADIUS_SHARE);
  const center: LayoutPoint = [width / 2, height / 2];
  // A right-pointing triangle whose centroid sits slightly right of centre, as play glyphs do.
  const h = radius * 0.9;
  const w = h * 0.87;
  const cx = center[0] + w * 0.12;
  const cy = center[1];
  return {
    center,
    radius,
    triangle: [
      [cx - w / 2, cy - h / 2],
      [cx - w / 2, cy + h / 2],
      [cx + w / 2, cy],
    ],
  };
}

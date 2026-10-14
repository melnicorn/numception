/**
 * The EXPERIENCE Motion levels, lowest first (Accessibility Floor):
 *
 * - `full`: every transition for the mode; capped, non-accelerating zoom.
 * - `calm` (the Kid default): every beat but collapses slowed by the tuning's `calmMotionScale`.
 * - `minimal`: zooms become cuts with a crossfade and every transition a crossfade
 *   of at least `MINIMAL_CROSSFADE_MS`; looping animations stop.
 */
export const MOTION_LEVELS = ['minimal', 'calm', 'full'] as const;

export type MotionLevel = (typeof MOTION_LEVELS)[number];

export function isMotionLevel(x: unknown): x is MotionLevel {
  return typeof x === 'string' && (MOTION_LEVELS as readonly string[]).includes(x);
}

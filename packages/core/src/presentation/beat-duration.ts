import type { MotionLevel } from '../settings/motion-level';
import type { TuningConfig } from '../tuning/tuning-config';
import { MINIMAL_CROSSFADE_MS } from './minimal-crossfade-ms';
import type { PresentationKind } from './presentation';

/** The tuning duration each beat reads; `collapse` is resolved by `firstCollapse`. */
const BEAT_KEY = {
  solve: 'solveMs',
  advance: 'advanceMs',
  roundStart: 'roundTransitionMs',
} as const;

/**
 * How long a beat of `kind` lasts, integer ms (AD-7, AD-20). A collapse lasts
 * `firstCollapseMs` the first time a profile sees one (`firstCollapse`),
 * `collapseMs` after, at every Motion level, so FR-9's caps (≤ 3 s first, ≤ 1.2 s
 * later) hold for every profile. Every other beat is the tuning's duration, times
 * `calmMotionScale` at Calm motion, rounded. Idle lasts 0.
 *
 * At Minimal motion the moving beats (`advance`, `collapse`, `roundStart`) are
 * crossfades of `MINIMAL_CROSSFADE_MS` (zooms become cuts); `solve` runs as at Full.
 */
export function beatDuration(
  kind: PresentationKind,
  tuning: TuningConfig,
  motion: MotionLevel,
  firstCollapse: boolean,
): number {
  if (kind === 'idle') return 0;
  if (motion === 'minimal' && kind !== 'solve') return MINIMAL_CROSSFADE_MS;
  const p = tuning.presentation;
  if (kind === 'collapse') return firstCollapse ? p.firstCollapseMs : p.collapseMs;
  return Math.round(p[BEAT_KEY[kind]] * (motion === 'calm' ? p.calmMotionScale : 1));
}

/**
 * How long the soft-miss cue runs, integer ms (FR-4): `softMissMs`, times
 * `calmMotionScale` at Calm motion, rounded (as at Full at Minimal). Not a beat: input stays open.
 */
export function softMissDuration(tuning: TuningConfig, motion: MotionLevel): number {
  const p = tuning.presentation;
  return Math.round(p.softMissMs * (motion === 'calm' ? p.calmMotionScale : 1));
}

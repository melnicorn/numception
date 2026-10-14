import type { ProfileSettings } from '../state/game-state';
import type { TuningConfig } from '../tuning/tuning-config';
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
 */
export function beatDuration(
  kind: PresentationKind,
  tuning: TuningConfig,
  motion: ProfileSettings['motion'],
  firstCollapse: boolean,
): number {
  if (kind === 'idle') return 0;
  const p = tuning.presentation;
  if (kind === 'collapse') return firstCollapse ? p.firstCollapseMs : p.collapseMs;
  return Math.round(p[BEAT_KEY[kind]] * (motion === 'calm' ? p.calmMotionScale : 1));
}

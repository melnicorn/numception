import { beatDuration } from '../presentation/beat-duration';
import type { Presentation, PresentationKind } from '../presentation/presentation';
import type { MotionLevel } from '../settings/motion-level';
import type { TuningConfig } from '../tuning/tuning-config';
import type { GameState } from './game-state';

/** The transition every beat draws until themes choose them per round (AD-15). */
export const DEFAULT_TRANSITION_ID = 'default';

/** The transition every moving beat draws at Minimal motion: a crossfade, zooms cut (EXPERIENCE Accessibility Floor). */
export const CROSSFADE_TRANSITION_ID = 'crossfade';

/** Nothing running, from `atMs`. */
export function idleAt(atMs: number): Presentation {
  return { kind: 'idle', startedAtMs: atMs, durationMs: 0, transitionId: 'none' };
}

/**
 * A `kind` beat starting at `atMs`, lasting `beatDuration` at Motion level `motion`
 * (the profile's effective level, `motionOf`); a collapse is the long first one
 * until `game.firstCollapseSeen`. At Minimal a moving beat draws the crossfade.
 */
export function beatAt(
  kind: Exclude<PresentationKind, 'idle'>,
  atMs: number,
  tuning: TuningConfig,
  game: GameState,
  motion: MotionLevel,
): Presentation {
  return {
    kind,
    startedAtMs: atMs,
    durationMs: beatDuration(kind, tuning, motion, !game.firstCollapseSeen),
    transitionId: motion === 'minimal' && kind !== 'solve' ? CROSSFADE_TRANSITION_ID : DEFAULT_TRANSITION_ID,
  };
}

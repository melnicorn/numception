import { beatDuration } from '../presentation/beat-duration';
import type { Presentation, PresentationKind } from '../presentation/presentation';
import type { TuningConfig } from '../tuning/tuning-config';
import type { GameState } from './game-state';

/** The transition every beat draws until themes choose them per round (AD-15). */
export const DEFAULT_TRANSITION_ID = 'default';

/** Nothing running, from `atMs`. */
export function idleAt(atMs: number): Presentation {
  return { kind: 'idle', startedAtMs: atMs, durationMs: 0, transitionId: 'none' };
}

/**
 * A `kind` beat starting at `atMs`, lasting `beatDuration` for `game`'s Motion
 * setting; a collapse is the long first one until `game.firstCollapseSeen`.
 */
export function beatAt(kind: Exclude<PresentationKind, 'idle'>, atMs: number, tuning: TuningConfig, game: GameState): Presentation {
  return {
    kind,
    startedAtMs: atMs,
    durationMs: beatDuration(kind, tuning, game.settings.motion, !game.firstCollapseSeen),
    transitionId: DEFAULT_TRANSITION_ID,
  };
}

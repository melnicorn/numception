import { effectiveMotion } from '../settings/effective-motion';
import type { MotionLevel } from '../settings/motion-level';
import type { AppState } from './app-state';
import type { GameState } from './game-state';

/** The Motion level `game` plays at in `state`: its setting, capped by the OS (`effectiveMotion`). */
export function motionOf(state: AppState, game: GameState): MotionLevel {
  return effectiveMotion(game.settings.motion, state.os.reduceMotion);
}

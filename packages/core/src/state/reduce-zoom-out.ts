import type { DomainError } from '../result/domain-error';
import { activeRound } from './active-round';
import type { AppState } from './app-state';
import { dropInput } from './drop-input';
import { isPlayable } from './is-playable';
import { reject } from './reject';
import type { StepResult } from './step-result';
import { withGame } from './with-game';
import { withRound } from './with-round';

const COMMAND = 'ZoomOut';

function invalid(message: string): DomainError {
  return { code: 'invalid-command', message };
}

/**
 * `ZoomOut` (AD-25): from the puzzle in view to the overview of its parent, where
 * it (and any other unsolved sibling) stays enterable. Only a puzzle zooms out:
 * an overview, or the top, is rejected, so the player is never left on an overview
 * with nothing enterable. Dropped while a beat runs.
 */
export function reduceZoomOut(state: AppState): StepResult {
  const active = activeRound(state);
  if (active === undefined) return reject(state, COMMAND, invalid('no active round'));
  const { game, round } = active;
  if (round.presentation.kind !== 'idle') return dropInput(state, COMMAND, round.presentation.kind);
  const inView = round.viewPath[round.viewPath.length - 1];
  if (inView === undefined || round.viewPath.length < 2) return reject(state, COMMAND, invalid('the top has no parent to zoom out to'));
  if (!isPlayable(round, inView)) return reject(state, COMMAND, invalid('an overview is already in view'));
  const zoomed = { ...round, viewPath: round.viewPath.slice(0, -1), shownAtMs: null };
  return { state: withGame(state, withRound(game, zoomed)), events: [] };
}

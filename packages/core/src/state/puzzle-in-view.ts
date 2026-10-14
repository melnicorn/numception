import type { Puzzle } from '../generator/puzzle';
import { activeRound } from './active-round';
import type { AppState } from './app-state';
import { isPlayable } from './is-playable';
import { roundPuzzle } from './round-puzzle';

/**
 * The puzzle in view in the active round (its cells, roles and answer), or
 * undefined when there is none or an overview is in view. For dev tools and test
 * hooks: the play view itself never carries the answer.
 */
export function puzzleInView(state: AppState): Puzzle | undefined {
  const active = activeRound(state);
  const node = active?.round.viewPath[active.round.viewPath.length - 1];
  if (active === undefined || node === undefined || !isPlayable(active.round, node)) return undefined;
  return roundPuzzle(active.round, node);
}

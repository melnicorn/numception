import type { AppState } from './app-state';
import type { GameState } from './game-state';
import type { Round } from './round';

/** The active profile and its active round, or undefined when either is missing. */
export function activeRound(state: AppState): { readonly game: GameState; readonly round: Round } | undefined {
  const game = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  const roundId = game?.rounds.activeRoundId ?? null;
  const round = game === undefined || roundId === null ? undefined : game.rounds.byId[roundId];
  return game === undefined || round === undefined ? undefined : { game, round };
}

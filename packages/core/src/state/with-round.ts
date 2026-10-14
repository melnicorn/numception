import type { GameState } from './game-state';
import type { Round } from './round';

/** `game` with `round` stored under its id (the active round stays as it is). */
export function withRound(game: GameState, round: Round): GameState {
  return { ...game, rounds: { ...game.rounds, byId: { ...game.rounds.byId, [round.roundId]: round } } };
}

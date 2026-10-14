import type { TuningConfig } from '../tuning/tuning-config';
import type { AppState } from './app-state';
import type { CommandContext } from './command-context';
import { idleAt } from './beat';
import { createProfile } from './create-profile';
import type { GameEvent } from './game-event';
import { reject } from './reject';
import { startRound } from './start-round';
import type { StepResult } from './step-result';
import { withGame } from './with-game';

/**
 * `StartSession`: creates the default Kid profile when there is no active one
 * (id `ids[0]`, rootSeed `seed32[0]`), then starts round `roundOrdinal` when the
 * profile has no active round (id: the next unused entropy id). A profile with an
 * active round keeps it. A new round opens idle, its first puzzle shown from now
 * (the first interactive frame is a puzzle).
 */
export function reduceStartSession(state: AppState, ctx: CommandContext, tuning: TuningConfig): StepResult {
  const events: GameEvent[] = [];
  const existing = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  const game = existing ?? createProfile('kid', ctx);
  if (existing === undefined) events.push({ type: 'ProfileCreated', profileId: game.profileId });
  const active = game.rounds.activeRoundId === null ? undefined : game.rounds.byId[game.rounds.activeRoundId];
  if (active !== undefined) return { state: withGame(state, game), events };

  const roundId = existing === undefined ? ctx.entropy.ids[1] : ctx.entropy.ids[0];
  const round = startRound(roundId, game, tuning, idleAt(game.clockMs), game.clockMs);
  if (!round.ok) return reject(state, 'StartSession', round.error);
  events.push({ type: 'RoundStarted', roundId, roundOrdinal: game.roundOrdinal });
  const next = { ...game, rounds: { activeRoundId: roundId, byId: { ...game.rounds.byId, [roundId]: round.value } } };
  return { state: withGame(state, next), events };
}

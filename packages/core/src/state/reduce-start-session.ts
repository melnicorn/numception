import type { ThemeCatalog } from '../theme/theme-catalog';
import type { TuningConfig } from '../tuning/tuning-config';
import type { TuningsByVersion } from '../tuning/tunings-by-version';
import type { AppState } from './app-state';
import type { CommandContext } from './command-context';
import { checkGameState } from '../save/check-game-state';
import { idleAt } from './beat';
import { completePresentation } from './complete-presentation';
import { createProfile } from './create-profile';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { reject } from './reject';
import { startRound } from './start-round';
import type { StepResult } from './step-result';
import { withGame } from './with-game';

/**
 * `StartSession`: creates the default Kid profile when there is no active one
 * (id `ids[0]`, rootSeed `seed32[0]`), then starts round `roundOrdinal` when the
 * profile has no active round (id: the next unused entropy id). A profile with an
 * active round keeps it (and its theme). A new round opens idle, its first puzzle shown from now
 * (the first interactive frame is a puzzle).
 *
 * With `restore` (a game loaded from a save, FR-10), that game is stored as the
 * active profile first, so its saved round, puzzle, solved cells, tier and view
 * continue: nothing new is created when it has an active round. A beat it was
 * saved in is completed to its end state (AD-20), so the first frame is the
 * puzzle, idle. A `restore` that is not a loadable game is rejected.
 */
export function reduceStartSession(state: AppState, ctx: CommandContext, tuning: TuningConfig, themes: ThemeCatalog, tunings: TuningsByVersion, restore?: unknown): StepResult {
  if (restore !== undefined) {
    const bad = checkGameState(restore);
    if (bad !== undefined) return reject(state, 'StartSession', { code: 'invalid-command', message: `restore: ${bad.message}` });
    const restored = withGame(state, restore as GameState);
    const completed = completePresentation(restored, tuning, themes, tunings);
    const started = reduceStartSession(completed.state, ctx, tuning, themes, tunings);
    if (started.events.some((e) => e.type === 'CommandRejected')) return { state, events: started.events };
    return { state: started.state, events: [...completed.events, ...started.events] };
  }
  const events: GameEvent[] = [];
  const existing = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  const game = existing ?? createProfile('kid', ctx);
  if (existing === undefined) events.push({ type: 'ProfileCreated', profileId: game.profileId });
  const active = game.rounds.activeRoundId === null ? undefined : game.rounds.byId[game.rounds.activeRoundId];
  if (active !== undefined) return { state: withGame(state, game), events };

  const roundId = existing === undefined ? ctx.entropy.ids[1] : ctx.entropy.ids[0];
  const round = startRound(roundId, game, tuning, idleAt(game.clockMs), game.clockMs, themes, null);
  if (!round.ok) return reject(state, 'StartSession', round.error);
  events.push({ type: 'RoundStarted', roundId, roundOrdinal: game.roundOrdinal });
  const next = { ...game, rounds: { activeRoundId: roundId, byId: { ...game.rounds.byId, [roundId]: round.value } } };
  return { state: withGame(state, next), events };
}

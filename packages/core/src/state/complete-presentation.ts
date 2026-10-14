import { BUILTIN_THEMES, type ThemeCatalog } from '../theme/theme-catalog';
import type { TuningConfig } from '../tuning/tuning-config';
import type { TuningsByVersion } from '../tuning/tunings-by-version';
import type { AppState } from './app-state';
import type { GameState } from './game-state';
import { rejected } from './rejected';
import { runTimeline } from './run-timeline';
import type { StepResult } from './step-result';
import { withGame } from './with-game';
import { withRound } from './with-round';

/** `game` with its active round's soft-miss cue ended (it is view data only; the guide line stays). */
function withoutSoftMiss(game: GameState): GameState {
  const round = game.rounds.activeRoundId === null ? undefined : game.rounds.byId[game.rounds.activeRoundId];
  return round === undefined || round.softMiss === null ? game : withRound(game, { ...round, softMiss: null });
}

/**
 * The active round with any running beat completed to its end state (AD-20: on
 * resume, a non-idle presentation completes; entry 4 calls this). Every beat left
 * ends now, at the profile's `clockMs`, so no play time is added, and the round
 * ends idle with the puzzle in view shown from now. A running soft-miss cue ends
 * too. Idle, or with no round, it changes nothing.
 */
export function completePresentation(
  state: AppState,
  tuning: TuningConfig,
  themes: ThemeCatalog = BUILTIN_THEMES,
  tunings: TuningsByVersion = {},
): StepResult {
  const found = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  if (found === undefined) return { state, events: [] };
  const game = withoutSoftMiss(found);
  const ran = runTimeline(game, tuning, () => game.clockMs, themes, tunings);
  if (ran.error !== null) return { state: withGame(state, ran.game), events: [...ran.events, rejected('completePresentation', ran.error)] };
  if (ran.game === found) return { state, events: [] };
  return { state: withGame(state, ran.game), events: ran.events };
}

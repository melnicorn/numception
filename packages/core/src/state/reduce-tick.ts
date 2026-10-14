import type { ThemeCatalog } from '../theme/theme-catalog';
import type { TuningConfig } from '../tuning/tuning-config';
import type { TuningsByVersion } from '../tuning/tunings-by-version';
import type { AppState } from './app-state';
import type { GameState } from './game-state';
import { reject } from './reject';
import { rejected } from './rejected';
import { runTimeline } from './run-timeline';
import type { StepResult } from './step-result';
import { withGame } from './with-game';
import { withRound } from './with-round';

/** `game` with its active round's soft-miss cue cleared once it has run its course by `game.clockMs`. */
function endSoftMiss(game: GameState): GameState {
  const round = game.rounds.activeRoundId === null ? undefined : game.rounds.byId[game.rounds.activeRoundId];
  const cue = round?.softMiss ?? null;
  if (round === undefined || cue === null || cue.startedAtMs + cue.durationMs > game.clockMs) return game;
  return withRound(game, { ...round, softMiss: null });
}

/**
 * `Tick { elapsedMs }` (AD-17, AD-20): adds `elapsedMs` to the active profile's
 * `clockMs` and ends every beat whose end time that reaches, in order, each next
 * beat starting where the last ended (so the timeline never drifts with frame
 * timing). Idle, it only accumulates time (and ends a soft-miss cue whose time
 * is up); with no profile it is a no-op.
 * `elapsedMs` must be a non-negative integer. A beat end that fails settles the
 * round idle and emits one `CommandRejected` (see `runTimeline`). While paused
 * (AD-17) it is ignored: no play time passes.
 */
export function reduceTick(state: AppState, elapsedMs: unknown, tuning: TuningConfig, themes: ThemeCatalog, tunings: TuningsByVersion): StepResult {
  if (typeof elapsedMs !== 'number' || !Number.isSafeInteger(elapsedMs) || elapsedMs < 0) {
    return reject(state, 'Tick', { code: 'invalid-command', message: 'Tick needs elapsedMs, a non-negative integer' });
  }
  const game = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  if (game === undefined || state.pauseReasons.length > 0) return { state, events: [] };
  const clockMs = game.clockMs + elapsedMs;
  const ran = runTimeline(endSoftMiss({ ...game, clockMs }), tuning, (p) => (p.startedAtMs + p.durationMs <= clockMs ? p.startedAtMs + p.durationMs : null), themes, tunings);
  const next = withGame(state, ran.game);
  if (ran.error !== null) return { state: next, events: [...ran.events, rejected('Tick', ran.error)] };
  return { state: next, events: ran.events };
}

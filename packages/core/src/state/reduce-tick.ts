import type { TuningConfig } from '../tuning/tuning-config';
import type { AppState } from './app-state';
import { reject } from './reject';
import { rejected } from './rejected';
import { runTimeline } from './run-timeline';
import type { StepResult } from './step-result';
import { withGame } from './with-game';

/**
 * `Tick { elapsedMs }` (AD-17, AD-20): adds `elapsedMs` to the active profile's
 * `clockMs` and ends every beat whose end time that reaches, in order, each next
 * beat starting where the last ended (so the timeline never drifts with frame
 * timing). Idle, it only accumulates time; with no profile it is a no-op.
 * `elapsedMs` must be a non-negative integer. A beat end that fails settles the
 * round idle and emits one `CommandRejected` (see `runTimeline`). While paused
 * (AD-17) it is ignored: no play time passes.
 */
export function reduceTick(state: AppState, elapsedMs: unknown, tuning: TuningConfig): StepResult {
  if (typeof elapsedMs !== 'number' || !Number.isSafeInteger(elapsedMs) || elapsedMs < 0) {
    return reject(state, 'Tick', { code: 'invalid-command', message: 'Tick needs elapsedMs, a non-negative integer' });
  }
  const game = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  if (game === undefined || state.pauseReasons.length > 0) return { state, events: [] };
  const clockMs = game.clockMs + elapsedMs;
  const ran = runTimeline({ ...game, clockMs }, tuning, (p) => (p.startedAtMs + p.durationMs <= clockMs ? p.startedAtMs + p.durationMs : null));
  const next = withGame(state, ran.game);
  if (ran.error !== null) return { state: next, events: [...ran.events, rejected('Tick', ran.error)] };
  return { state: next, events: ran.events };
}

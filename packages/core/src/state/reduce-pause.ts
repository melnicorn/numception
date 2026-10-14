import type { TuningConfig } from '../tuning/tuning-config';
import type { AppState } from './app-state';
import { completePresentation } from './complete-presentation';
import type { GameEvent } from './game-event';
import { isPauseReason, type PauseReason } from './pause-reason';
import { reject } from './reject';
import type { StepResult } from './step-result';

/** `reasons` plus `added`, sorted and without duplicates. */
function withReasons(reasons: readonly PauseReason[], added: readonly PauseReason[]): PauseReason[] {
  return [...new Set([...reasons, ...added])].sort();
}

/**
 * `Pause { reason }` (AD-17, AD-20): adds `reason` to `pauseReasons` (with `blur`
 * too for `lifecycle`, so the board comes back veiled), and completes any running
 * beat to its end state at the current play time (`completePresentation`), so a
 * backgrounded beat never resumes half-drawn and the saved state is settled.
 * Emits the beats' events, then `Paused`. Pausing for a reason already present
 * changes nothing.
 */
export function reducePause(state: AppState, reason: unknown, tuning: TuningConfig): StepResult {
  if (!isPauseReason(reason)) return reject(state, 'Pause', { code: 'invalid-command', message: 'Pause needs a reason: blur, gate, lifecycle or panel' });
  const pauseReasons = withReasons(state.pauseReasons, reason === 'lifecycle' ? ['lifecycle', 'blur'] : [reason]);
  const completed = completePresentation(state, tuning);
  const changed = pauseReasons.length !== state.pauseReasons.length;
  if (!changed && completed.state === state) return { state, events: [] };
  const events: GameEvent[] = [...completed.events];
  if (changed) events.push({ type: 'Paused', reason, pauseReasons });
  return { state: { ...completed.state, pauseReasons }, events };
}

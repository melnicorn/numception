import type { AppState } from './app-state';
import { isPauseReason } from './pause-reason';
import { reject } from './reject';
import type { StepResult } from './step-result';

/**
 * `Resume { reason }` (AD-17): removes `reason` from `pauseReasons`; play time
 * runs again once the set is empty. `Resume { lifecycle }` leaves `blur`, which
 * only the next input clears. Resuming a reason not present changes nothing.
 */
export function reduceResume(state: AppState, reason: unknown): StepResult {
  if (!isPauseReason(reason)) return reject(state, 'Resume', { code: 'invalid-command', message: 'Resume needs a reason: blur, gate, lifecycle or panel' });
  if (!state.pauseReasons.includes(reason)) return { state, events: [] };
  const pauseReasons = state.pauseReasons.filter((r) => r !== reason);
  return { state: { ...state, pauseReasons }, events: [{ type: 'Resumed', reason, pauseReasons }] };
}

import type { AppState } from './app-state';
import { reject } from './reject';
import type { StepResult } from './step-result';

/**
 * `SetTransitionOverride { transitionId }` (dev panel): every round change from
 * now draws `transitionId` while it is in the round's pool (`selectTransition`;
 * Minimal motion still crossfades), or the usual draw again with null. Device-scoped
 * runtime state like `os`: works without a profile, never persisted, emits nothing.
 */
export function reduceSetTransitionOverride(state: AppState, transitionId: unknown): StepResult {
  if (transitionId !== null && (typeof transitionId !== 'string' || transitionId === '')) {
    return reject(state, 'SetTransitionOverride', { code: 'invalid-command', message: 'SetTransitionOverride needs transitionId, a non-empty string or null' });
  }
  if (state.overrides.transitionId === transitionId) return { state, events: [] };
  return { state: { ...state, overrides: { ...state.overrides, transitionId } }, events: [] };
}

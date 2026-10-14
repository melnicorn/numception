import type { AppState } from './app-state';
import { reject } from './reject';
import type { StepResult } from './step-result';

/**
 * `SetOsPreferences { reduceMotion }` (AD-16, AD-21): records what the OS reports.
 * Device-scoped runtime state, so it works before any profile exists; emits
 * nothing. OS Reduce Motion caps play at Minimal from the next beat (`effectiveMotion`).
 */
export function reduceSetOsPreferences(state: AppState, reduceMotion: unknown): StepResult {
  if (typeof reduceMotion !== 'boolean') {
    return reject(state, 'SetOsPreferences', { code: 'invalid-command', message: 'SetOsPreferences needs reduceMotion, a boolean' });
  }
  if (state.os.reduceMotion === reduceMotion) return { state, events: [] };
  return { state: { ...state, os: { ...state.os, reduceMotion } }, events: [] };
}

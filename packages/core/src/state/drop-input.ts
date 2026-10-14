import type { PresentationKind } from '../presentation/presentation';
import type { AppState } from './app-state';
import type { StepResult } from './step-result';

/** Input that arrived while a beat runs (AD-20): `state` unchanged, with one `InputDropped`. */
export function dropInput(state: AppState, command: string, presentation: PresentationKind): StepResult {
  return { state, events: [{ type: 'InputDropped', command, presentation }] };
}

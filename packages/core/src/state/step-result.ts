import type { AppState } from './app-state';
import type { GameEvent } from './game-event';

/** What `step` returns: the next state and the events that produced it (AD-2). */
export type StepResult = { readonly state: AppState; readonly events: readonly GameEvent[] };

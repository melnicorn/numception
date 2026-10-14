import { BUILTIN_TRANSITIONS, type TransitionCatalog } from '../transition/transition-catalog';
import type { AppState } from './app-state';

/** Where a new round's transition is drawn from: the catalogue (AD-15) and the dev override (`SetTransitionOverride`). */
export type TransitionSource = { readonly catalog: TransitionCatalog; readonly override: string | null };

/** The built-in catalogue, no override (tests and callers with no catalogue). */
export const BUILTIN_TRANSITION_SOURCE: TransitionSource = Object.freeze({ catalog: BUILTIN_TRANSITIONS, override: null });

/** `catalog` with `state`'s dev override. */
export function transitionSource(state: AppState, catalog: TransitionCatalog): TransitionSource {
  return { catalog, override: state.overrides.transitionId };
}

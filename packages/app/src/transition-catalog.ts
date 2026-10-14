import { BUILTIN_TRANSITIONS, parseTransition, type Transition, type TransitionCatalog } from '@numception/core';

/** A bundled transition file left out of the catalogue, and why (for a dev log). */
export type RejectedTransition = { readonly source: string; readonly message: string };

/** The transitions the game draws from, plus the files that failed validation. */
export type LoadedTransitionCatalog = { readonly transitions: TransitionCatalog; readonly rejected: readonly RejectedTransition[] };

/**
 * Parses and validates every bundled transition (AD-15), like `loadThemeCatalog`:
 * `files` maps a source name (e.g. `content/transitions/<id>.json`) to its parsed
 * JSON. A file that fails `parseTransition`, whose `transitionId` doesn't match its
 * file name, or that repeats an id is left out and reported in `rejected`. With
 * none left, core's built-in catalogue (interpolate and crossfade). Sources are
 * taken in name order.
 */
export function loadTransitionCatalog(files: Readonly<Record<string, unknown>>): LoadedTransitionCatalog {
  const transitions: Transition[] = [];
  const rejected: RejectedTransition[] = [];
  for (const source of Object.keys(files).sort()) {
    const parsed = parseTransition(files[source]);
    const stem = source.replace(/^.*\//, '').replace(/\.json$/, '');
    if (!parsed.ok) rejected.push({ source, message: parsed.error.message });
    else if (parsed.value.transitionId !== stem) rejected.push({ source, message: `transitionId ${parsed.value.transitionId} does not match the file name` });
    else if (transitions.some((t) => t.transitionId === parsed.value.transitionId)) rejected.push({ source, message: `duplicate transitionId ${parsed.value.transitionId}` });
    else transitions.push(parsed.value);
  }
  return { transitions: transitions.length === 0 ? BUILTIN_TRANSITIONS : transitions, rejected };
}

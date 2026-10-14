import type { Transition } from './transition';

/** The transition every moving beat draws at Minimal motion, and every round change there: a crossfade (EXPERIENCE Accessibility Floor). */
export const CROSSFADE_TRANSITION_ID = 'crossfade';

/** The calm round change drawn when the catalogue offers none: token interpolation (the look rounds had before the library). */
export const FALLBACK_TRANSITION_ID = 'interpolate';

/**
 * The transitions a build can draw (AD-15): the bundled `content/transitions/*.json`
 * that validated, passed in by the composition root like the themes. Order does
 * not matter (selection sorts by id); ids are unique.
 */
export type TransitionCatalog = readonly Transition[];

/** The built-in catalogue: token interpolation and the Minimal crossfade. Used when nothing bundled loads, and by default in tests. */
export const BUILTIN_TRANSITIONS: TransitionCatalog = Object.freeze([
  Object.freeze({
    kind: 'Transition',
    schemaVersion: 1,
    transitionId: CROSSFADE_TRANSITION_ID,
    name: 'Crossfade',
    tag: 'calm',
    start: 'after-tap',
    maxFlashesPerSecond: 1,
    audioCue: 'whoosh',
  } as const),
  Object.freeze({
    kind: 'Transition',
    schemaVersion: 1,
    transitionId: FALLBACK_TRANSITION_ID,
    name: 'Token interpolation',
    tag: 'calm',
    start: 'after-tap',
    maxFlashesPerSecond: 1,
    audioCue: 'whoosh',
  } as const),
]);

/** The transition `transitionId` of `catalog`, or undefined. */
export function transitionById(catalog: TransitionCatalog, transitionId: string): Transition | undefined {
  return catalog.find((t) => t.transitionId === transitionId);
}

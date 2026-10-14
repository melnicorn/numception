import * as v from 'valibot';

/** A transition's intensity (DESIGN Transition looks): calm ones may run in Zen and at Calm motion; intense ones only in Normal at Full. */
export const TRANSITION_TAGS = ['calm', 'intense'] as const;
export type TransitionTag = (typeof TRANSITION_TAGS)[number];

/** Where a transition starts (EXPERIENCE Player causality): at the tap point, or whole-screen after the tap. */
export const TRANSITION_STARTS = ['on-tap', 'after-tap'] as const;
export type TransitionStart = (typeof TRANSITION_STARTS)[number];

/** AD-23: no transition may flash more than 3 times a second. */
export const MAX_FLASHES_PER_SECOND = 3;

/**
 * Transition schema, schemaVersion 1 (AD-15): one registered transition as a
 * bundled `content/transitions/<transitionId>.json` file. Strict.
 *
 * - `transitionId`: the id core stores on a round and render draws by.
 * - `tag`: `calm` | `intense`; `start`: `on-tap` | `after-tap`.
 * - `maxFlashesPerSecond`: the most luminance flashes it draws in any second,
 *   0..3 (AD-23; entry 7's CI check sums it with the concurrent effects).
 * - `audioCue`: the sound cue id the feedback director plays as it starts, or null.
 */
export const TransitionSchema = v.strictObject({
  kind: v.literal('Transition'),
  schemaVersion: v.literal(1),
  transitionId: v.pipe(v.string(), v.regex(/^[a-z][a-z0-9-]*$/, 'must be a lowercase kebab-case id')),
  name: v.pipe(v.string(), v.minLength(1, 'must not be empty')),
  tag: v.picklist(TRANSITION_TAGS),
  start: v.picklist(TRANSITION_STARTS),
  maxFlashesPerSecond: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(MAX_FLASHES_PER_SECOND)),
  audioCue: v.nullable(v.pipe(v.string(), v.regex(/^[a-z][a-zA-Z0-9]*$/, 'must be a camelCase cue id'))),
});

/** One registered transition (AD-15). */
export type Transition = v.InferOutput<typeof TransitionSchema>;

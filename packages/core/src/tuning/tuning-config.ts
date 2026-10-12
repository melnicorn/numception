import * as v from 'valibot';
import { MAX_TUNING_VALUE } from './max-tuning-value';

/**
 * TuningConfig schema, schemaVersion 1 (AD-7). Minimal for now: only the
 * generation parameters the POC generator reads. Later entries extend it. Unknown
 * keys are rejected, so a typo can't silently fall back to a default, and the only
 * operator a POC build enables is `add` (no × or ÷).
 */
export const TuningConfigSchema = v.strictObject({
  kind: v.literal('TuningConfig'),
  schemaVersion: v.literal(1),
  tuningVersion: v.pipe(v.number(), v.integer(), v.minValue(1)),
  generation: v.strictObject({
    operators: v.pipe(v.array(v.picklist(['add'])), v.minLength(1)),
    maxValue: v.pipe(v.number(), v.integer(), v.minValue(3), v.maxValue(MAX_TUNING_VALUE)),
  }),
});

/** A validated tuning config. Obtain one with `parseTuning`. */
export type TuningConfig = v.InferOutput<typeof TuningConfigSchema>;

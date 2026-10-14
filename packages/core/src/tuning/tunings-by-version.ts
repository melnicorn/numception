import type { TuningConfig } from './tuning-config';

/**
 * Every bundled tuning this build can still play, keyed by `tuningVersion` (AD-7):
 * a round stays pinned to the tuning it was planned under, so a round saved under
 * an older version keeps realising its leaves with that version.
 */
export type TuningsByVersion = Readonly<Record<number, TuningConfig>>;

/** The tuning `round` is pinned to: `tunings[tuningVersion]`, or `active` when that is it or none is bundled. */
export function pinnedTuning(tuningVersion: number, active: TuningConfig, tunings: TuningsByVersion): TuningConfig {
  return tuningVersion === active.tuningVersion ? active : (tunings[tuningVersion] ?? active);
}

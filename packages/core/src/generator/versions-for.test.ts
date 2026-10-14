import { describe, expect, it } from 'vitest';
import type { TuningConfig } from '../tuning/tuning-config';
import { versionsFor } from './versions-for';

function tuning(tuningVersion: number): TuningConfig {
  return { kind: 'TuningConfig', schemaVersion: 1, tuningVersion, generation: { operators: ['add'], n: { min: 3, max: 3 }, bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 0 }] }], distractors: { nearMissDelta: 1, nearMissShare: 0 }, retries: { maxAttempts: 1 } }, presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 } };
}

describe('versionsFor', () => {
  it("records this build's generator and difficulty model versions", () => {
    expect(versionsFor(tuning(1))).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });
  });

  it("takes tuningVersion from the config", () => {
    expect(versionsFor(tuning(7)).tuningVersion).toBe(7);
  });
});

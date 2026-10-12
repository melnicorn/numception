import { describe, expect, it } from 'vitest';
import type { TuningConfig } from '../tuning/tuning-config';
import { versionsFor } from './versions-for';

function tuning(tuningVersion: number): TuningConfig {
  return { kind: 'TuningConfig', schemaVersion: 1, tuningVersion, generation: { operators: ['add'], maxValue: 20 } };
}

describe('versionsFor', () => {
  it("records this build's generator and difficulty model versions", () => {
    expect(versionsFor(tuning(1))).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });
  });

  it("takes tuningVersion from the config", () => {
    expect(versionsFor(tuning(7)).tuningVersion).toBe(7);
  });
});

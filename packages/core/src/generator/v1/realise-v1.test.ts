import { describe, expect, it } from 'vitest';
import type { PuzzleSpec } from '../puzzle-spec';
import type { PuzzleVersions } from '../puzzle-versions';
import { realise } from '../realise';
import { realiseV1 } from './realise-v1';

const spec: PuzzleSpec = { n: 3, operator: 'add', maxValue: 50 };
const versions: PuzzleVersions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };

describe('realiseV1', () => {
  it('is what realise dispatches to for generatorVersion 1', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const nodeId = { tier: 1 + (seed % 3), index: seed % 7 };
      const dispatched = realise(seed, nodeId, spec, versions);
      expect(dispatched).toEqual({ ok: true, value: realiseV1(seed, nodeId, spec, versions) });
    }
  });

  it('copies its inputs rather than aliasing them', () => {
    const nodeId = { tier: 1, index: 0 };
    const p = realiseV1(3, nodeId, spec, versions);
    expect(p.nodeId).not.toBe(nodeId);
    expect(p.spec).not.toBe(spec);
    expect(p.versions).not.toBe(versions);
  });
});

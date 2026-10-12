import { describe, expect, it } from 'vitest';
import type { PuzzleBand, PuzzleSpec } from '../puzzle-spec';
import type { PuzzleVersions } from '../puzzle-versions';
import { realise } from '../realise';
import { realiseV1 } from './realise-v1';

const band: PuzzleBand = { band: 2, minValue: 1, maxValue: 50, maxCarries: 1 };
const spec: PuzzleSpec = { n: 6, operator: 'add', band, fallbackBands: [], nearMissCount: 2, nearMissDelta: 2, maxAttempts: 20 };
const versions: PuzzleVersions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };

describe('realiseV1', () => {
  it('is what realise dispatches to for generatorVersion 1', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const nodeId = { tier: 1 + (seed % 3), index: seed % 7 };
      const s: PuzzleSpec = { ...spec, operator: seed % 2 === 0 ? 'add' : 'sub' };
      expect(realise(seed, nodeId, s, versions)).toEqual(realiseV1(seed, nodeId, s, versions));
    }
  });

  it('copies its inputs rather than aliasing them', () => {
    const nodeId = { tier: 1, index: 0 };
    const withFallback: PuzzleSpec = { ...spec, fallbackBands: [{ band: 1, minValue: 1, maxValue: 20, maxCarries: 0 }] };
    const result = realiseV1(3, nodeId, withFallback, versions);
    if (!result.ok) throw new Error(result.error.message);
    const p = result.value;
    expect(p.nodeId).not.toBe(nodeId);
    expect(p.spec).not.toBe(withFallback);
    expect(p.spec.band).not.toBe(withFallback.band);
    expect(p.spec.fallbackBands[0]).not.toBe(withFallback.fallbackBands[0]);
    expect(p.spec).toEqual(withFallback);
    expect(p.versions).not.toBe(versions);
  });

  it('records the contract only when the spec has one', () => {
    const plain = realiseV1(1, { tier: 1, index: 0 }, spec, versions);
    expect(plain.ok && 'contract' in plain.value.spec).toBe(false);
    const contracted = realiseV1(1, { tier: 1, index: 0 }, { ...spec, contract: 30 }, versions);
    expect(contracted.ok && contracted.value.spec.contract).toBe(30);
  });

  it("records a near-miss shortfall on a band's last attempt rather than exceeding the count", () => {
    // One attempt in 1..20 with n 9: exact counts are rare, so the last-attempt
    // retry with fewer near-misses is what serves these.
    const tight: PuzzleSpec = { ...spec, n: 9, band: { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 }, nearMissCount: 6, maxAttempts: 1 };
    let shortfalls = 0;
    for (let seed = 0; seed < 300; seed += 1) {
      const result = realiseV1(seed, { tier: 1, index: 0 }, tight, versions);
      if (!result.ok) {
        expect(result.error.code).toBe('unrealisable');
        continue;
      }
      expect(result.value.nearMisses).toBeLessThanOrEqual(6);
      if (result.value.nearMisses < 6) shortfalls += 1;
    }
    expect(shortfalls).toBeGreaterThan(0);
  });

  it('falls back band by band, nearest first, recording the clamp', () => {
    const b3: PuzzleBand = { band: 3, minValue: 60, maxValue: 99, maxCarries: 1 };
    const b2: PuzzleBand = { band: 2, minValue: 30, maxValue: 59, maxCarries: 1 };
    const b1: PuzzleBand = { band: 1, minValue: 1, maxValue: 29, maxCarries: 1 };
    // Contract 25 is below bands 3 and 2: only band 1 hosts it.
    const result = realiseV1(9, { tier: 1, index: 0 }, { ...spec, n: 3, nearMissCount: 0, band: b3, fallbackBands: [b2, b1], contract: 25 }, versions);
    expect(result.ok && result.value.clamp).toEqual({ requestedBand: 3, servedBand: 1 });
    expect(result.ok && result.value.servedBand).toBe(1);
  });

  it('realises a wide no-carry band in a single attempt for every seed in a sample', () => {
    // Sampling must find a carry-free triple within its draws; a one-attempt band
    // used to come back unrealisable for about 40% of seeds.
    const noCarry: PuzzleSpec = { ...spec, n: 9, band: { band: 1, minValue: 100, maxValue: 9999, maxCarries: 0 }, maxAttempts: 1 };
    for (const nearMissCount of [0, 3, 6]) {
      for (let seed = 0; seed < 300; seed += 1) {
        const result = realiseV1(seed, { tier: 1, index: 0 }, { ...noCarry, nearMissCount }, versions);
        expect(result.ok, result.ok ? '' : result.error.message).toBe(true);
      }
    }
  });

  it('searches narrow bands exhaustively, so a realisable band 1 at n 9 always realises', () => {
    const b1: PuzzleBand = { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 };
    for (let seed = 0; seed < 100; seed += 1) {
      const result = realiseV1(seed, { tier: 1, index: 0 }, { ...spec, n: 9, band: b1, nearMissCount: 0, nearMissDelta: 1, maxAttempts: 100 }, versions);
      expect(result.ok, result.ok ? '' : result.error.message).toBe(true);
    }
  });
});

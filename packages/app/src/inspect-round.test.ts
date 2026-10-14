import { deriveSeed } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { DEMO_SEED } from './demo-puzzle';
import { type InspectRoundRequest, inspectRound, type RoundInspectorView } from './inspect-round';
import { roundInspectorOptions } from './round-inspector-options';

// Same shape as content/tuning/1.json (app never imports content; the client passes
// it in, AD-7). tools/tuning-content.test.ts validates the real file.
const tuningV1 = {
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 9 },
    bands: [
      { band: 1, minValue: 1, maxValue: 99, maxCarries: 1 },
      { band: 2, minValue: 10, maxValue: 199, maxCarries: 1 },
      { band: 3, minValue: 10, maxValue: 499, maxCarries: 2 },
      { band: 4, minValue: 10, maxValue: 999, maxCarries: 2 },
    ],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
};

const tunings = { '1': tuningV1 };

const request = (over: Partial<InspectRoundRequest> = {}): InspectRoundRequest => ({
  tuningVersion: 1,
  type: 'tower',
  n: 9,
  operator: 'sub',
  seed: DEMO_SEED,
  ...over,
});

function view(over: Partial<InspectRoundRequest> = {}): RoundInspectorView {
  const result = inspectRound(tunings, request(over));
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.view;
}

const all = (v: RoundInspectorView) => v.tiers.flatMap((t) => t.nodes);
const nodeAt = (v: RoundInspectorView, tier: number, index: number) => all(v).find((x) => x.tier === tier && x.index === index);

/** Every node below the top answers its parent's cell (child i·n + j is cell j of parent i). */
function expectContractsHold(v: RoundInspectorView): void {
  for (const node of all(v)) {
    if (node.tier === v.tiers[0]!.tier) {
      expect(node.contract).toBeUndefined();
      continue;
    }
    const parent = nodeAt(v, node.tier + 1, Math.floor(node.index / v.n))!;
    expect(node.contract).toBe(parent.cells[node.index % v.n]!.text);
    expect(node.answerText).toBe(node.contract);
  }
}

describe('inspectRound', () => {
  it('plans a Tower at n = 9 (sub): 91 puzzles, tiers 3 → 1, answers marked, bucketIds', () => {
    const v = view();
    expect(v.puzzleCount).toBe(91);
    expect(v.tiers.map((t) => t.tier)).toEqual([3, 2, 1]);
    expect(v.tiers.map((t) => t.nodes.length)).toEqual([1, 9, 81]);
    expect(v.operatorSymbol).toBe('−');
    expect(v.roundSeed).toBe(deriveSeed(DEMO_SEED, 0));
    expect(v.versions).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });
    for (const node of all(v)) {
      expect(node.label).toBe(`t${node.tier}.${node.index}`);
      expect(node.cells).toHaveLength(9);
      expect(node.cells.filter((c) => c.isAnswer)).toHaveLength(1);
      expect(node.cells.find((c) => c.isAnswer)?.text).toBe(node.answerText);
      expect(node.bucketId).toMatch(/^dm1\|sub\|d\d+\|c\d+\|n9\|nm\d+$/);
      expect(node.clamped).toBe(false);
    }
    expectContractsHold(v);
  });

  it('plans a Classic at n = 3 (add): 4 puzzles', () => {
    const v = view({ type: 'classic', n: 3, operator: 'add' });
    expect(v.puzzleCount).toBe(4);
    expect(v.tiers.map((t) => t.nodes.map((x) => x.label))).toEqual([['t2.0'], ['t1.0', 't1.1', 't1.2']]);
    expectContractsHold(v);
  });

  it('is deterministic, and the seed may be given as text', () => {
    expect(view()).toEqual(view());
    expect(view({ seed: String(DEMO_SEED) })).toEqual(view());
    expect(view({ seed: 7 })).not.toEqual(view());
  });

  it('realises leaves in the leaf band, marking clamps where it fell back', () => {
    const v = view({ n: 5, leafBand: 4 });
    expect(v.leafBand).toBe(4);
    const leaves = v.tiers.find((t) => t.tier === 1)!.nodes;
    expect(leaves).toHaveLength(25);
    for (const leaf of leaves) {
      expect(leaf.clamped).toBe(leaf.servedBand !== 4);
      expect(leaf.servedBand).toBeLessThanOrEqual(4);
    }
    // Leaf contracts fit band 1 (1..99), and band 4 starts at 10, so some serve lower.
    expect(leaves.some((l) => l.clamped)).toBe(true);
    expectContractsHold(v);
    // Upper tiers are the planned puzzles whatever the leaf band.
    expect(v.tiers.slice(0, 2)).toEqual(view({ n: 5 }).tiers.slice(0, 2));
  });

  it.each([-1, 'abc', '', '1.5', 2 ** 32, Number.NaN])('rejects the bad seed %j', (seed) => {
    const result = inspectRound(tunings, request({ seed }));
    expect(result).toMatchObject({ ok: false, error: { code: 'invalid-seed' } });
  });

  it('rejects an unknown tuning version', () => {
    expect(inspectRound(tunings, request({ tuningVersion: 2 }))).toMatchObject({ ok: false, error: { code: 'unknown-tuning' } });
    expect(inspectRound({ '2': tuningV1 }, request({ tuningVersion: 2 }))).toMatchObject({
      ok: false,
      error: { code: 'unknown-tuning' },
    });
  });

  it('returns tuning, request and band errors, never throws', () => {
    expect(inspectRound({ '1': { kind: 'nope' } }, request())).toMatchObject({ ok: false, error: { code: 'invalid-tuning' } });
    expect(inspectRound(tunings, request({ n: 10 }))).toMatchObject({ ok: false });
    expect(inspectRound(tunings, request({ leafBand: 9 }))).toMatchObject({ ok: false, error: { code: 'invalid-spec' } });
    expect(inspectRound(tunings, request({ type: 'pyramid' as never }))).toMatchObject({
      ok: false,
      error: { code: 'invalid-request' },
    });
  });
});

describe('roundInspectorOptions', () => {
  it("lists every tuning's n range, operators and bands, lowest version first", () => {
    const options = roundInspectorOptions({ '2': { ...tuningV1, tuningVersion: 2 }, '1': tuningV1, shipped: {} });
    expect(options.defaultTuningVersion).toBe(1);
    expect(options.tunings.map((t) => t.tuningVersion)).toEqual([1, 2]);
    expect(options.tunings[0]).toEqual({
      tuningVersion: 1,
      ok: true,
      nMin: 3,
      nMax: 9,
      operators: [
        { operator: 'add', symbol: '+' },
        { operator: 'sub', symbol: '−' },
      ],
      bands: [1, 2, 3, 4],
    });
  });

  it('defaults to the lowest version without 1, and lists invalid tunings with their error', () => {
    const options = roundInspectorOptions({ '3': { kind: 'nope' }, '2': { ...tuningV1, tuningVersion: 2 } });
    expect(options.defaultTuningVersion).toBe(2);
    expect(options.tunings[1]).toMatchObject({ tuningVersion: 3, ok: false, error: { code: 'invalid-tuning' } });
    expect(roundInspectorOptions({}).defaultTuningVersion).toBeUndefined();
  });

  it('lists a tuning whose tuningVersion differs from its key as invalid, as inspectRound rejects it', () => {
    const options = roundInspectorOptions({ '2': tuningV1 });
    expect(options.tunings[0]).toMatchObject({ tuningVersion: 2, ok: false, error: { code: 'unknown-tuning' } });
  });
});

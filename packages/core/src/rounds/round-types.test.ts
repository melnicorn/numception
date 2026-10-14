import { describe, expect, it } from 'vitest';
import type { Operator } from '../generator/operator';
import { realise } from '../generator/realise';
import { deriveSeed } from '../random/derive-seed';
import { specFor } from '../spec/spec-for';
import { parseTuning } from '../tuning/parse-tuning';
import type { TuningConfig } from '../tuning/tuning-config';
import { attemptSeed } from './attempt-seed';
import { roundPlanProblems } from './plan-problems';
import { pathFromTop } from './path-from-top';
import { playOrder } from './play-order';
import type { PlanRequest, RoundPlan } from './round-plan';
import { planRound, realiseRoundNode, ROUND_TYPES } from './round-types';

/** Same bands as content/tuning/1.json (tools/round-content.test.ts plans with the real file). */
const TUNING_JSON = {
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 9 },
    bands: [
      {
        band: 1,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 1, maxValue: 20, maxCarries: 1 },
          { nMin: 5, nMax: 6, minValue: 1, maxValue: 30, maxCarries: 1 },
          { nMin: 7, nMax: 8, minValue: 1, maxValue: 60, maxCarries: 1 },
          { nMin: 9, nMax: 9, minValue: 1, maxValue: 99, maxCarries: 1 },
        ],
      },
      {
        band: 2,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 1, maxValue: 50, maxCarries: 1 },
          { nMin: 5, nMax: 6, minValue: 5, maxValue: 99, maxCarries: 1 },
          { nMin: 7, nMax: 9, minValue: 10, maxValue: 199, maxCarries: 1 },
        ],
      },
      {
        band: 3,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 5, maxValue: 99, maxCarries: 1 },
          { nMin: 5, nMax: 6, minValue: 10, maxValue: 199, maxCarries: 2 },
          { nMin: 7, nMax: 9, minValue: 10, maxValue: 499, maxCarries: 2 },
        ],
      },
      {
        band: 4,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 10, maxValue: 199, maxCarries: 2 },
          { nMin: 5, nMax: 6, minValue: 10, maxValue: 499, maxCarries: 2 },
          { nMin: 7, nMax: 9, minValue: 10, maxValue: 999, maxCarries: 2 },
        ],
      },
    ],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 },
};

function tuningOf(json: unknown): TuningConfig {
  const parsed = parseTuning(json);
  if (!parsed.ok) throw new Error(parsed.error.message);
  return parsed.value;
}

const tuning = tuningOf(TUNING_JSON);
const versions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };
const TYPES = ['classic', 'tower'] as const;
const OPERATORS: Operator[] = ['add', 'sub'];
const NS = [3, 4, 5, 6, 7, 8, 9];

function plan(request: PlanRequest, roundSeed = deriveSeed(20261012, 0), t: TuningConfig = tuning): RoundPlan {
  const result = planRound(request, t, roundSeed, versions);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
}

function topOf(p: RoundPlan) {
  return p.nodes[0]!.puzzle!;
}

describe('round planning: consistency for every n, operator and type (FR-2)', () => {
  const combos = TYPES.flatMap((type) => OPERATORS.flatMap((operator) => NS.map((n) => ({ type, operator, n }))));

  it.each(combos)('$type $operator n $n: plans a consistent round with every leaf realisable in band 1', ({ type, operator, n }) => {
    for (const ordinal of [0, 1, 2]) {
      const p = plan({ type, n, operator }, deriveSeed(7, ordinal));
      expect(roundPlanProblems(p, tuning)).toEqual([]);
      expect(p.nodes).toHaveLength(type === 'classic' ? n + 1 : n * n + n + 1);
      expect(p.tiers).toBe(type === 'classic' ? 2 : 3);
      expect(p.nodes[0]!.nodeId).toEqual({ tier: p.tiers, index: 0 });
      const leaves = p.nodes.filter((x) => x.nodeId.tier === 1);
      expect(leaves).toHaveLength(type === 'classic' ? n : n * n);
      for (const leaf of leaves) expect(Object.keys(leaf).sort()).toEqual(['contract', 'nodeId']);
    }
  });

  it('records the request, seed and versions in a JSON-safe plan', () => {
    const roundSeed = deriveSeed(1, 2);
    const p = plan({ type: 'tower', n: 4, operator: 'sub' }, roundSeed);
    expect(p).toMatchObject({ kind: 'RoundPlan', schemaVersion: 1, roundSeed, type: 'tower', n: 4, operator: 'sub', startBand: 1, tiers: 3, versions });
    expect(p.fixedTopCell).toBeUndefined();
    expect(JSON.parse(JSON.stringify(p))).toEqual(p);
  });

  it('is deterministic: same inputs, same plan; another ordinal, another plan', () => {
    const request = { type: 'tower', n: 6, operator: 'add' } as const;
    expect(plan(request, deriveSeed(99, 3))).toEqual(plan(request, deriveSeed(99, 3)));
    expect(plan(request, deriveSeed(99, 3))).not.toEqual(plan(request, deriveSeed(99, 4)));
  });

  it('realises each tier-2 Tower puzzle with its top cell as the answer', () => {
    const p = plan({ type: 'tower', n: 5, operator: 'add' });
    const top = topOf(p);
    for (let j = 0; j < 5; j += 1) {
      const node = p.nodes.find((x) => x.nodeId.tier === 2 && x.nodeId.index === j)!;
      expect(node.contract).toBe(top.cells[j]!.n);
      expect(node.puzzle!.cells[node.puzzle!.answerIndex]!.n).toBe(top.cells[j]!.n);
    }
  });
});

describe('RoundType.realise (lazy leaves, AD-4)', () => {
  const p = plan({ type: 'classic', n: 5, operator: 'add' });

  it('returns the planned puzzle for an upper-tier node, whatever the band', () => {
    expect(realiseRoundNode(p, { tier: 2, index: 0 }, 1, tuning)).toEqual({ ok: true, value: topOf(p) });
    expect(ROUND_TYPES.classic.realise(p, { tier: 2, index: 0 }, 4, tuning)).toEqual({ ok: true, value: topOf(p) });
  });

  it('realises a leaf in band 1 exactly as the plan-time check did, answer = contract', () => {
    for (const leaf of p.nodes.filter((x) => x.nodeId.tier === 1)) {
      const result = realiseRoundNode(p, leaf.nodeId, 1, tuning);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.value.seed).toBe(p.roundSeed);
      expect(result.value.nodeId).toEqual(leaf.nodeId);
      expect(result.value.cells[result.value.answerIndex]!.n).toBe(leaf.contract);
      expect(result.value.clamp).toBeUndefined();
    }
  });

  it('realises a leaf in the requested band, recording a clamp when that band cannot host the contract', () => {
    // At n 7..9 bands 2..4 start at 10, so a contract below 10 is served by band 1.
    let seen = { hosted: false, clamped: false };
    for (let ordinal = 0; ordinal < 20 && !(seen.hosted && seen.clamped); ordinal += 1) {
      const q = plan({ type: 'classic', n: 7, operator: 'sub' }, deriveSeed(3, ordinal));
      for (const leaf of q.nodes.filter((x) => x.nodeId.tier === 1)) {
        const result = realiseRoundNode(q, leaf.nodeId, 3, tuning);
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        expect(result.value.cells[result.value.answerIndex]!.n).toBe(leaf.contract);
        if (leaf.contract! < 10) {
          expect(result.value.clamp).toEqual({ requestedBand: 3, servedBand: 1 });
          seen = { ...seen, clamped: true };
        } else if (result.value.clamp === undefined) {
          expect(result.value.servedBand).toBe(3);
          seen = { ...seen, hosted: true };
        }
      }
    }
    expect(seen).toEqual({ hosted: true, clamped: true });
  });

  it("serves the planner's own band-1 puzzle when the requested band and those between can't host the contract", () => {
    // At n 7..9 bands 2..4 start at 10, so a leaf contract below 10 forces the band-1 fallback.
    let checked = 0;
    for (let ordinal = 0; ordinal < 20; ordinal += 1) {
      const q = plan({ type: 'tower', n: 7, operator: 'add' }, deriveSeed(4, ordinal));
      for (const leaf of q.nodes.filter((x) => x.nodeId.tier === 1 && x.contract! < 10)) {
        const spec = specFor(tuning, { n: 7, operator: 'add', band: 1, contract: leaf.contract! });
        if (!spec.ok) throw new Error(spec.error.message);
        // Exactly the planner's check: the leaf's fresh stream, the band-1 spec.
        const planned = realise(q.roundSeed, leaf.nodeId, spec.value, versions);
        expect(planned.ok).toBe(true);
        if (!planned.ok) continue;
        for (const band of [2, 4]) {
          const result = realiseRoundNode(q, leaf.nodeId, band, tuning);
          expect(result).toEqual({ ok: true, value: { ...planned.value, clamp: { requestedBand: band, servedBand: 1 } } });
        }
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('rejects a node outside the round, a foreign plan, another tuning and a missing band', () => {
    expect(realiseRoundNode(p, { tier: 1, index: 5 }, 1, tuning)).toMatchObject({ ok: false, error: { code: 'invalid-node-id' } });
    expect(realiseRoundNode(p, { tier: 3, index: 0 }, 1, tuning)).toMatchObject({ ok: false, error: { code: 'invalid-node-id' } });
    expect(ROUND_TYPES.tower.realise(p, { tier: 1, index: 0 }, 1, tuning)).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
    expect(realiseRoundNode({ ...p, type: 'pyramid' as never }, { tier: 1, index: 0 }, 1, tuning)).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
    expect(realiseRoundNode(null as never, { tier: 1, index: 0 }, 1, tuning)).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
    const other = tuningOf({ ...TUNING_JSON, tuningVersion: 2 });
    expect(realiseRoundNode(p, { tier: 1, index: 0 }, 1, other)).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
    expect(realiseRoundNode(p, { tier: 1, index: 0 }, 9, tuning)).toMatchObject({ ok: false, error: { code: 'invalid-spec' } });
  });
});

describe('fixed top cell (OQ-4)', () => {
  it.each(TYPES)('%s: pins a value at child index 2 and keeps every tier consistent', (type) => {
    for (const operator of OPERATORS) {
      const free = plan({ type, n: 5, operator });
      const value = topOf(free).cells[topOf(free).answerIndex]!.n;
      const p = plan({ type, n: 5, operator, fixedTopCell: { childIndex: 2, value } });
      expect(topOf(p).cells[2]!.n).toBe(value);
      expect(p.fixedTopCell).toEqual({ childIndex: 2, value });
      expect(roundPlanProblems(p, tuning)).toEqual([]);
      expect(plan({ type, n: 5, operator, fixedTopCell: { childIndex: 2, value } })).toEqual(p);
    }
  });

  it('pins a value that is not an answer, e.g. a distractor of another top', () => {
    const free = plan({ type: 'classic', n: 6, operator: 'add' }, deriveSeed(5, 5));
    const top = topOf(free);
    const distractor = top.cells.find((_, i) => i !== top.roles.a && i !== top.roles.b && i !== top.roles.c)!.n;
    const p = plan({ type: 'classic', n: 6, operator: 'add', fixedTopCell: { childIndex: 0, value: distractor } });
    expect(topOf(p).cells[0]!.n).toBe(distractor);
    expect(roundPlanProblems(p, tuning)).toEqual([]);
  });

  it('is unplannable when no candidate top can carry the value', () => {
    const cases = [
      [2, /fixed value is below 3, the smallest contract tier 1 can take/],
      [5000, /none of 64 candidate top puzzles contained the fixed value/],
    ] as const;
    for (const [value, message] of cases) {
      const result = planRound({ type: 'classic', n: 5, operator: 'add', fixedTopCell: { childIndex: 1, value } }, tuning, 1, versions);
      expect(result).toMatchObject({ ok: false, error: { code: 'unplannable' } });
      if (!result.ok) expect(result.error.message).toMatch(message);
    }
  });
});

describe('bad requests', () => {
  const seed = 1;

  it.each([
    ['n 10', { type: 'classic', n: 10, operator: 'add' }, 'invalid-request'],
    ['n 2', { type: 'tower', n: 2, operator: 'add' }, 'invalid-request'],
    ['n 4.5', { type: 'tower', n: 4.5, operator: 'add' }, 'invalid-request'],
    ['unknown type', { type: 'pyramid', n: 4, operator: 'add' }, 'invalid-request'],
    ['operator mul', { type: 'classic', n: 4, operator: 'mul' }, 'invalid-request'],
    ['band 0', { type: 'classic', n: 4, operator: 'add', band: 0 }, 'invalid-request'],
    ['band not in the tuning', { type: 'classic', n: 4, operator: 'add', band: 5 }, 'invalid-spec'],
    ['childIndex out of range', { type: 'classic', n: 4, operator: 'add', fixedTopCell: { childIndex: 4, value: 10 } }, 'invalid-request'],
    ['fixed value not a positive integer', { type: 'classic', n: 4, operator: 'add', fixedTopCell: { childIndex: 0, value: 0 } }, 'invalid-request'],
    ['fixedTopCell not an object', { type: 'classic', n: 4, operator: 'add', fixedTopCell: 3 }, 'invalid-request'],
    ['null request', null, 'invalid-request'],
  ])('%s → %s', (_name, request, code) => {
    expect(planRound(request as never, tuning, seed, versions)).toMatchObject({ ok: false, error: { code } });
  });

  it('reports an operator or n the tuning does not enable as a spec error', () => {
    const bands = [{ band: 1, ranges: [{ nMin: 3, nMax: 6, minValue: 1, maxValue: 99, maxCarries: 1 }] }];
    const subOnly = tuningOf({ ...TUNING_JSON, generation: { ...TUNING_JSON.generation, operators: ['sub'], n: { min: 3, max: 6 }, bands } });
    expect(planRound({ type: 'classic', n: 4, operator: 'add' }, subOnly, seed, versions)).toMatchObject({ ok: false, error: { code: 'invalid-spec' } });
    expect(planRound({ type: 'classic', n: 7, operator: 'sub' }, subOnly, seed, versions)).toMatchObject({ ok: false, error: { code: 'invalid-spec' } });
  });

  it('rejects a bad seed, mismatched versions and a request for another type', () => {
    const request = { type: 'classic', n: 4, operator: 'add' } as const;
    expect(planRound(request, tuning, -1, versions)).toMatchObject({ ok: false, error: { code: 'invalid-seed' } });
    expect(planRound(request, tuning, 2 ** 32, versions)).toMatchObject({ ok: false, error: { code: 'invalid-seed' } });
    expect(planRound(request, tuning, seed, { ...versions, tuningVersion: 2 })).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
    expect(planRound(request, tuning, seed, { ...versions, generatorVersion: 99 })).toMatchObject({ ok: false, error: { code: 'unsupported-version' } });
    expect(ROUND_TYPES.tower.plan(request, tuning, seed, versions)).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
  });
});

describe('unplannable tunings', () => {
  it("returns unplannable, without throwing and in bounded time, when band 1 can't host any leaf contract", () => {
    // Band 1 holds 3 values, so no n = 4 leaf fits; the upper tiers plan in band 2.
    const cramped = tuningOf({
      ...TUNING_JSON,
      generation: {
        ...TUNING_JSON.generation,
        bands: [
          { band: 1, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 3, maxCarries: 0 }] },
          { band: 2, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 99, maxCarries: 1 }] },
        ],
      },
    });
    for (const type of TYPES) {
      for (const operator of OPERATORS) {
        const started = Date.now();
        const result = planRound({ type, n: 4, operator, band: 2 }, cramped, 12345, versions);
        expect(Date.now() - started).toBeLessThan(1000);
        expect(result).toMatchObject({ ok: false, error: { code: 'unplannable' } });
        if (!result.ok) expect(result.error.message).toMatch(/top puzzles with every cell at least \d+ had every child plannable \(every leaf contract must realise in band 1\)/);
      }
    }
  });

  it('says so when the top itself is unrealisable in the start band', () => {
    const tooNarrow = tuningOf({ ...TUNING_JSON, generation: { ...TUNING_JSON.generation, bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 6, maxCarries: 0 }] }] } });
    const result = planRound({ type: 'classic', n: 9, operator: 'add' }, tooNarrow, 1, versions);
    expect(result).toMatchObject({ ok: false, error: { code: 'unplannable' } });
    if (!result.ok) expect(result.error.message).toMatch(/the top puzzle is unrealisable in start band 1/);
  });

  it('discards top draws with a cell below the contract floor without spending an attempt', () => {
    // Tower add at n 3 in 1..20: only about 1 top in 8 has both addends >= 7 (the
    // tier-2 floor), so 16 counted draws would leave about 1 round in 8 unplannable.
    const easy = tuningOf({
      ...TUNING_JSON,
      generation: { ...TUNING_JSON.generation, bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 20, maxCarries: 1 }] }] },
    });
    for (let ordinal = 0; ordinal < 100; ordinal += 1) {
      const result = planRound({ type: 'tower', n: 3, operator: 'add' }, easy, deriveSeed(5, ordinal), versions);
      expect(result.ok, result.ok ? '' : result.error.message).toBe(true);
      if (result.ok) expect(roundPlanProblems(result.value, easy)).toEqual([]);
    }
  });

  it('moves on to the next top draw when one is unrealisable, as for lower tiers', () => {
    // One realisation attempt per draw at n 7 in 1..30: some top draws are unrealisable.
    const tight = tuningOf({
      ...TUNING_JSON,
      generation: {
        ...TUNING_JSON.generation,
        bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 30, maxCarries: 1 }] }],
        retries: { maxAttempts: 1 },
      },
    });
    const top = { tier: 2, index: 0 };
    const spec = specFor(tight, { n: 7, operator: 'add', band: 1 });
    if (!spec.ok) throw new Error(spec.error.message);
    let checked = 0;
    for (let roundSeed = 0; roundSeed < 300 && checked < 3; roundSeed += 1) {
      if (realise(attemptSeed(roundSeed, 0), top, spec.value, versions).ok) continue;
      const result = planRound({ type: 'classic', n: 7, operator: 'add' }, tight, roundSeed, versions);
      expect(result.ok, result.ok ? '' : result.error.message).toBe(true);
      if (!result.ok) continue;
      expect(result.value.nodes[0]!.puzzle!.seed).not.toBe(attemptSeed(roundSeed, 0));
      expect(roundPlanProblems(result.value, tight)).toEqual([]);
      checked += 1;
    }
    expect(checked).toBe(3);
  });

  it('says when no top draw clears the contract floor', () => {
    // Tower add needs top cells >= 7; in 1..8 no triple a + b = c has a, b >= 7.
    const low = tuningOf({ ...TUNING_JSON, generation: { ...TUNING_JSON.generation, bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 8, maxCarries: 1 }] }] } });
    const started = Date.now();
    const result = planRound({ type: 'tower', n: 3, operator: 'add' }, low, 1, versions);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(result).toMatchObject({ ok: false, error: { code: 'unplannable' } });
    if (!result.ok) expect(result.error.message).toMatch(/none of 256 top puzzles had every cell at least 7/);
  });

  it('returns unplannable for the first POC bands (1..20, no carries) at Tower add n 9', () => {
    const narrow = tuningOf({
      ...TUNING_JSON,
      generation: { ...TUNING_JSON.generation, bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 20, maxCarries: 0 }] }] },
    });
    expect(planRound({ type: 'tower', n: 9, operator: 'add' }, narrow, 1, versions)).toMatchObject({ ok: false, error: { code: 'unplannable' } });
  });
});

describe('ROUND_TYPES registry', () => {
  it('holds classic (2 tiers) and tower (3 tiers), frozen', () => {
    expect(Object.keys(ROUND_TYPES).sort()).toEqual(['classic', 'tower']);
    expect(ROUND_TYPES.classic.tiers).toBe(2);
    expect(ROUND_TYPES.tower.tiers).toBe(3);
    expect(Object.isFrozen(ROUND_TYPES)).toBe(true);
    expect(Object.isFrozen(ROUND_TYPES.classic)).toBe(true);
  });

  it('plans through the registry entry the same as through planRound', () => {
    const request = { type: 'tower', n: 3, operator: 'sub' } as const;
    expect(ROUND_TYPES.tower.plan(request, tuning, 77, versions)).toEqual(planRound(request, tuning, 77, versions));
  });

  it('onSolve collapses a group into its parent once its last child is solved, and isComplete is the top', () => {
    for (const type of TYPES) {
      const p = plan({ type, n: 3, operator: 'add' });
      const solved = new Set<string>();
      const isSolved = (node: { tier: number; index: number }) => solved.has(`${node.tier}.${node.index}`);
      const collapses: string[] = [];
      for (const node of playOrder(p.tiers, p.n)) {
        expect(ROUND_TYPES[type].isComplete(p, isSolved)).toBe(false);
        solved.add(`${node.tier}.${node.index}`);
        const into = ROUND_TYPES[type].onSolve(p, node, isSolved).collapsesInto;
        if (into !== null) collapses.push(`${into.tier}.${into.index}`);
      }
      expect(ROUND_TYPES[type].isComplete(p, isSolved)).toBe(true);
      expect(collapses).toEqual(type === 'classic' ? ['2.0'] : ['2.0', '2.1', '2.2', '3.0']);
    }
  });

  it('onSolve does not collapse while a sibling is unsolved, whatever order the group is solved in', () => {
    const p = plan({ type: 'tower', n: 3, operator: 'add' });
    const solved = new Set(['1.2', '1.0']);
    const isSolved = (node: { tier: number; index: number }) => solved.has(`${node.tier}.${node.index}`);
    expect(ROUND_TYPES.tower.onSolve(p, { tier: 1, index: 0 }, isSolved).collapsesInto).toBeNull();
    solved.add('1.1');
    expect(ROUND_TYPES.tower.onSolve(p, { tier: 1, index: 1 }, isSolved).collapsesInto).toEqual({ tier: 2, index: 0 });
  });
});

describe('playOrder and pathFromTop', () => {
  it('orders a round breadth-first, leaves first, top last', () => {
    const keys = (tiers: number) => playOrder(tiers, 3).map((x) => `${x.tier}.${x.index}`);
    expect(keys(2)).toEqual(['1.0', '1.1', '1.2', '2.0']);
    expect(keys(3)).toEqual(['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '2.0', '2.1', '2.2', '3.0']);
  });

  it('builds the viewPath from the top down to a node', () => {
    expect(pathFromTop({ tier: 1, index: 7 }, 3, 3)).toEqual([
      { tier: 3, index: 0 },
      { tier: 2, index: 2 },
      { tier: 1, index: 7 },
    ]);
    expect(pathFromTop({ tier: 2, index: 0 }, 2, 3)).toEqual([{ tier: 2, index: 0 }]);
  });
});

import { describe, expect, it } from 'vitest';
import { parseTuning } from './parse-tuning';

const generation = {
  operators: ['add', 'sub'],
  n: { min: 3, max: 9 },
  bands: [
    {
      band: 1,
      ranges: [
        { nMin: 3, nMax: 5, minValue: 1, maxValue: 20, maxCarries: 0 },
        { nMin: 6, nMax: 9, minValue: 1, maxValue: 50, maxCarries: 1 },
      ],
    },
    { band: 2, ranges: [{ nMin: 3, nMax: 9, minValue: 10, maxValue: 999, maxCarries: 2 }] },
  ],
  distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
  retries: { maxAttempts: 100 },
};

const presentation = { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25, softMissMs: 600 };

const valid = { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 1, generation, presentation };

function withPresentation(patch: Record<string, unknown>): unknown {
  return { ...valid, presentation: { ...presentation, ...patch } };
}

function withGeneration(patch: Record<string, unknown>): unknown {
  return { ...valid, generation: { ...generation, ...patch } };
}

function withBand1(patch: Record<string, unknown>): unknown {
  return withGeneration({ bands: [{ ...generation.bands[0], ...patch }, generation.bands[1]] });
}

/** Band 1 with its first range (n 3..5) patched. */
function withRange1(patch: Record<string, unknown>): unknown {
  const [first, second] = generation.bands[0]!.ranges;
  return withBand1({ ranges: [{ ...first, ...patch }, second] });
}

/** Band 2 with its ranges replaced by `ranges` (each [nMin, nMax]). */
function withBand2Ranges(...ranges: [number, number][]): unknown {
  const bands = [generation.bands[0], { band: 2, ranges: ranges.map(([nMin, nMax]) => ({ nMin, nMax, minValue: 10, maxValue: 999, maxCarries: 2 })) }];
  return withGeneration({ bands });
}

/** The issues of a config that must fail, or a marker if it parsed. */
function issuesOf(input: unknown): readonly string[] {
  const result = parseTuning(input);
  return result.ok ? ['<parsed ok>'] : result.error.code === 'invalid-tuning' ? result.error.issues : [result.error.message];
}

describe('parseTuning', () => {
  it('accepts a full valid config', () => {
    expect(parseTuning(valid)).toEqual({ ok: true, value: valid });
  });

  it.each([
    ['add only', withGeneration({ operators: ['add'] })],
    ['sub only', withGeneration({ operators: ['sub'] })],
    ['a single n', withGeneration({ n: { min: 9, max: 9 }, bands: [{ band: 1, ranges: [{ nMin: 9, nMax: 9, minValue: 1, maxValue: 99, maxCarries: 1 }] }] })],
    ['the smallest range, 1..3', withRange1({ minValue: 1, maxValue: 3 })],
    ['the largest range ceiling, 2^31 − 1', withRange1({ minValue: 1, maxValue: 0x7fffffff })],
    ['one range per n', withBand2Ranges([3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9])],
    ['ranges matching a narrower n range', withGeneration({ n: { min: 4, max: 6 }, bands: [{ band: 1, ranges: [{ nMin: 4, nMax: 6, minValue: 1, maxValue: 20, maxCarries: 0 }] }] })],
    ['nearMissShare 0', withGeneration({ distractors: { nearMissDelta: 1, nearMissShare: 0 } })],
    ['nearMissShare 1', withGeneration({ distractors: { nearMissDelta: 1, nearMissShare: 1 } })],
    ['maxAttempts 1000', withGeneration({ retries: { maxAttempts: 1000 } })],
    ['zero-length beats', withPresentation({ solveMs: 0, advanceMs: 0, roundTransitionMs: 0 })],
    ['calmMotionScale 1', withPresentation({ calmMotionScale: 1 })],
  ])('accepts %s', (_name, input) => {
    expect(issuesOf(input)).toEqual(['<parsed ok>']);
  });

  // [name, input, the dot path the first issue must name]
  const bad: [string, unknown, string][] = [
    ['missing generation', { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 1, presentation }, 'generation'],
    ['missing presentation', { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 1, generation }, 'presentation'],
    ['wrong kind', { ...valid, kind: 'Theme' }, 'kind'],
    ['wrong schemaVersion', { ...valid, schemaVersion: 2 }, 'schemaVersion'],
    ['tuningVersion 0', { ...valid, tuningVersion: 0 }, 'tuningVersion'],
    ['unknown top-level key', { ...valid, extra: true }, 'extra'],
    ['the removed generation.maxValue', withGeneration({ maxValue: 20 }), 'generation.maxValue'],
    ['unknown generation key', withGeneration({ ties: 0 }), 'generation.ties'],
    // × and ÷ (FR-3 POC)
    ['mul', withGeneration({ operators: ['add', 'mul'] }), 'generation.operators.1'],
    ['div', withGeneration({ operators: ['div'] }), 'generation.operators.0'],
    ['no operators', withGeneration({ operators: [] }), 'generation.operators'],
    ['repeated operator', withGeneration({ operators: ['add', 'add'] }), 'generation.operators'],
    // n
    ['n.min 2', withGeneration({ n: { min: 2, max: 9 } }), 'generation.n.min'],
    ['n.min above n.max', withGeneration({ n: { min: 6, max: 5 } }), 'generation.n.max'],
    ['n.max 10', withGeneration({ n: { min: 3, max: 10 } }), 'generation.n.max'],
    ['fractional n', withGeneration({ n: { min: 3.5, max: 9 } }), 'generation.n.min'],
    ['unknown n key', withGeneration({ n: { min: 3, max: 9, step: 1 } }), 'generation.n.step'],
    // bands
    ['no bands', withGeneration({ bands: [] }), 'generation.bands'],
    [
      'non-contiguous bands',
      withGeneration({ bands: [generation.bands[0], { ...generation.bands[1], band: 3 }] }),
      'generation.bands',
    ],
    ['bands not starting at 1', withGeneration({ bands: [{ ...generation.bands[0], band: 2 }] }), 'generation.bands'],
    ['bands out of order', withGeneration({ bands: [{ ...generation.bands[0], band: 2 }, { ...generation.bands[1], band: 1 }] }), 'generation.bands'],
    ['band 0', withBand1({ band: 0 }), 'generation.bands.0.band'],
    ['unknown band key', withBand1({ weight: 1 }), 'generation.bands.0.weight'],
    ['the old flat band shape', withBand1({ minValue: 1 }), 'generation.bands.0.minValue'],
    ['no ranges', withBand1({ ranges: [] }), 'generation.bands.0.ranges'],
    ['missing ranges', withGeneration({ bands: [{ band: 1 }] }), 'generation.bands.0.ranges'],
    // per-n ranges
    ['maxValue below minValue + 2', withRange1({ minValue: 5, maxValue: 6 }), 'generation.bands.0.ranges.0.maxValue'],
    ['minValue 0', withRange1({ minValue: 0 }), 'generation.bands.0.ranges.0.minValue'],
    ['maxValue above 2^31 − 1', withRange1({ maxValue: 2 ** 31 }), 'generation.bands.0.ranges.0.maxValue'],
    ['fractional maxValue', withRange1({ maxValue: 10.5 }), 'generation.bands.0.ranges.0.maxValue'],
    ['negative maxCarries', withRange1({ maxCarries: -1 }), 'generation.bands.0.ranges.0.maxCarries'],
    ['unknown range key', withRange1({ weight: 1 }), 'generation.bands.0.ranges.0.weight'],
    ['nMin 2', withRange1({ nMin: 2 }), 'generation.bands.0.ranges.0.nMin'],
    ['nMax 10', withBand2Ranges([3, 10]), 'generation.bands.1.ranges.0.nMax'],
    ['nMax below nMin', withBand2Ranges([3, 5], [7, 6], [7, 9]), 'generation.bands.1.ranges.1.nMax'],
    ['a gap in n (3–5 and 7–9)', withBand2Ranges([3, 5], [7, 9]), 'generation.bands.1.ranges'],
    ['overlapping n (3–6 and 5–9)', withBand2Ranges([3, 6], [5, 9]), 'generation.bands.1.ranges'],
    ['ranges out of n order', withBand2Ranges([6, 9], [3, 5]), 'generation.bands.1.ranges'],
    ['ranges starting above n.min', withBand2Ranges([4, 9]), 'generation.bands'],
    ['ranges ending below n.max', withBand2Ranges([3, 5], [6, 8]), 'generation.bands'],
    ['ranges running past n.max', withGeneration({ n: { min: 3, max: 8 } }), 'generation.bands'],
    // distractors and retries
    ['nearMissShare 1.5', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: 1.5 } }), 'generation.distractors.nearMissShare'],
    ['negative nearMissShare', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: -0.1 } }), 'generation.distractors.nearMissShare'],
    ['NaN nearMissShare', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: Number.NaN } }), 'generation.distractors.nearMissShare'],
    ['nearMissDelta 0', withGeneration({ distractors: { nearMissDelta: 0, nearMissShare: 0.5 } }), 'generation.distractors.nearMissDelta'],
    ['unknown distractors key', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: 0.5, x: 1 } }), 'generation.distractors.x'],
    ['maxAttempts 0', withGeneration({ retries: { maxAttempts: 0 } }), 'generation.retries.maxAttempts'],
    ['maxAttempts 1001', withGeneration({ retries: { maxAttempts: 1001 } }), 'generation.retries.maxAttempts'],
    ['unknown retries key', withGeneration({ retries: { maxAttempts: 10, backoff: 2 } }), 'generation.retries.backoff'],
    // presentation
    ['negative solveMs', withPresentation({ solveMs: -1 }), 'presentation.solveMs'],
    ['fractional collapseMs', withPresentation({ collapseMs: 1200.5 }), 'presentation.collapseMs'],
    ['firstCollapseMs over a minute', withPresentation({ firstCollapseMs: 60_001 }), 'presentation.firstCollapseMs'],
    ['calmMotionScale 0', withPresentation({ calmMotionScale: 0 }), 'presentation.calmMotionScale'],
    ['fractional softMissMs', withPresentation({ softMissMs: 600.5 }), 'presentation.softMissMs'],
    ['missing softMissMs', { ...valid, presentation: { ...presentation, softMissMs: undefined } }, 'presentation.softMissMs'],
    ['missing advanceMs', { ...valid, presentation: { ...presentation, advanceMs: undefined } }, 'presentation.advanceMs'],
    ['unknown presentation key', withPresentation({ zoomMs: 1 }), 'presentation.zoomMs'],
  ];

  it.each(bad)('rejects %s, naming the failing path', (_name, input, path) => {
    const result = parseTuning(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('invalid-tuning');
    expect(result.error.message).toMatch(/^Invalid TuningConfig: /);
    if (result.error.code === 'invalid-tuning') expect(result.error.issues[0]).toMatch(new RegExp(`^${path.replaceAll('.', '\\.')}: `));
  });

  it.each([
    ['null', null],
    ['a string', 'TuningConfig'],
    ['undefined', undefined],
  ])('returns an invalid-tuning error, without throwing, for %s', (_name, input) => {
    const result = parseTuning(input);
    expect(!result.ok && result.error.code).toBe('invalid-tuning');
  });

  it('explains the cross-field rules', () => {
    expect(issuesOf(withRange1({ minValue: 5, maxValue: 6 }))[0]).toMatch(/at least minValue \+ 2/);
    expect(issuesOf(withGeneration({ n: { min: 6, max: 5 } }))[0]).toMatch(/at least n\.min/);
    expect(issuesOf(withGeneration({ bands: [{ ...generation.bands[0], band: 2 }] }))[0]).toMatch(/contiguously from 1/);
    expect(issuesOf(withBand2Ranges([3, 5], [7, 9]))[0]).toMatch(/the ranges of band 2 must be ordered by n, with no gap or overlap/);
    expect(issuesOf(withBand2Ranges([3, 6], [5, 9]))[0]).toMatch(/the ranges of band 2 must be ordered by n, with no gap or overlap/);
    expect(issuesOf(withBand2Ranges([3, 5], [6, 6], [7, 9], [4, 4]))[0]).toMatch(/the ranges of band 2 .*no gap or overlap/);
    expect(issuesOf(withRange1({ nMax: 4 }))[0]).toMatch(/^generation\.bands\.0\.ranges: the ranges of band 1 .*no gap or overlap/);
    expect(issuesOf(withBand2Ranges([4, 9]))[0]).toMatch(/the ranges of band 2 must cover n 3\.\.9 exactly/);
    expect(issuesOf(withGeneration({ n: { min: 3, max: 8 } }))[0]).toMatch(/the ranges of bands 1, 2 must cover n 3\.\.8 exactly/);
    expect(issuesOf(withGeneration({ operators: ['sub', 'sub'] }))[0]).toMatch(/must not repeat/);
  });
});

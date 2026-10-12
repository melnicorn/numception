import { describe, expect, it } from 'vitest';
import { parseTuning } from './parse-tuning';

const generation = {
  operators: ['add', 'sub'],
  n: { min: 3, max: 9 },
  bands: [
    { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 },
    { band: 2, minValue: 10, maxValue: 999, maxCarries: 2 },
  ],
  distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
  retries: { maxAttempts: 100 },
};

const valid = { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 1, generation };

function withGeneration(patch: Record<string, unknown>): unknown {
  return { ...valid, generation: { ...generation, ...patch } };
}

function withBand1(patch: Record<string, unknown>): unknown {
  return withGeneration({ bands: [{ ...generation.bands[0], ...patch }] });
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
    ['a single n', withGeneration({ n: { min: 9, max: 9 } })],
    ['the smallest band, 1..3', withBand1({ minValue: 1, maxValue: 3 })],
    ['the largest band ceiling, 2^31 − 1', withBand1({ minValue: 1, maxValue: 0x7fffffff })],
    ['nearMissShare 0', withGeneration({ distractors: { nearMissDelta: 1, nearMissShare: 0 } })],
    ['nearMissShare 1', withGeneration({ distractors: { nearMissDelta: 1, nearMissShare: 1 } })],
    ['maxAttempts 1000', withGeneration({ retries: { maxAttempts: 1000 } })],
  ])('accepts %s', (_name, input) => {
    expect(issuesOf(input)).toEqual(['<parsed ok>']);
  });

  // [name, input, the dot path the first issue must name]
  const bad: [string, unknown, string][] = [
    ['missing generation', { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 1 }, 'generation'],
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
    ['bands not starting at 1', withBand1({ band: 2 }), 'generation.bands'],
    ['bands out of order', withGeneration({ bands: [{ ...generation.bands[0], band: 2 }, { ...generation.bands[1], band: 1 }] }), 'generation.bands'],
    ['maxValue below minValue + 2', withBand1({ minValue: 5, maxValue: 6 }), 'generation.bands.0.maxValue'],
    ['minValue 0', withBand1({ minValue: 0 }), 'generation.bands.0.minValue'],
    ['maxValue above 2^31 − 1', withBand1({ maxValue: 2 ** 31 }), 'generation.bands.0.maxValue'],
    ['fractional maxValue', withBand1({ maxValue: 10.5 }), 'generation.bands.0.maxValue'],
    ['negative maxCarries', withBand1({ maxCarries: -1 }), 'generation.bands.0.maxCarries'],
    ['band 0', withBand1({ band: 0 }), 'generation.bands.0.band'],
    ['unknown band key', withBand1({ weight: 1 }), 'generation.bands.0.weight'],
    // distractors and retries
    ['nearMissShare 1.5', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: 1.5 } }), 'generation.distractors.nearMissShare'],
    ['negative nearMissShare', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: -0.1 } }), 'generation.distractors.nearMissShare'],
    ['NaN nearMissShare', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: Number.NaN } }), 'generation.distractors.nearMissShare'],
    ['nearMissDelta 0', withGeneration({ distractors: { nearMissDelta: 0, nearMissShare: 0.5 } }), 'generation.distractors.nearMissDelta'],
    ['unknown distractors key', withGeneration({ distractors: { nearMissDelta: 2, nearMissShare: 0.5, x: 1 } }), 'generation.distractors.x'],
    ['maxAttempts 0', withGeneration({ retries: { maxAttempts: 0 } }), 'generation.retries.maxAttempts'],
    ['maxAttempts 1001', withGeneration({ retries: { maxAttempts: 1001 } }), 'generation.retries.maxAttempts'],
    ['unknown retries key', withGeneration({ retries: { maxAttempts: 10, backoff: 2 } }), 'generation.retries.backoff'],
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
    expect(issuesOf(withBand1({ minValue: 5, maxValue: 6 }))[0]).toMatch(/at least minValue \+ 2/);
    expect(issuesOf(withGeneration({ n: { min: 6, max: 5 } }))[0]).toMatch(/at least n\.min/);
    expect(issuesOf(withBand1({ band: 2 }))[0]).toMatch(/contiguously from 1/);
    expect(issuesOf(withGeneration({ operators: ['sub', 'sub'] }))[0]).toMatch(/must not repeat/);
  });
});

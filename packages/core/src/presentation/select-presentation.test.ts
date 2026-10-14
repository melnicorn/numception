import { describe, expect, it } from 'vitest';
import { deriveSeed } from '../random/derive-seed';
import { parseTuning } from '../tuning/parse-tuning';
import { selectPresentation } from './select-presentation';

const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add'],
    n: { min: 3, max: 3 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 900, calmMotionScale: 1.25, softMissMs: 600 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

type Entry = { themeId: string; mode: 'zen' | 'normal' };
const ZEN2: Entry[] = [
  { themeId: 'moonwater', mode: 'zen' },
  { themeId: 'kiln', mode: 'zen' },
];
const MIXED: Entry[] = [
  ...ZEN2,
  { themeId: 'washi-ink', mode: 'zen' },
  { themeId: 'vector-noir', mode: 'normal' },
  { themeId: 'overdrive-bloom', mode: 'normal' },
];

/** The themes of rounds 0..count−1 of a run from `rootSeed`, each chosen after the last. */
function sequence(rootSeed: number, count: number, catalog: Entry[]): string[] {
  const out: string[] = [];
  let previous: string | null = null;
  for (let ordinal = 0; ordinal < count; ordinal += 1) {
    const { themeId } = selectPresentation({ mode: 'zen', previousThemeId: previous, roundSeed: deriveSeed(rootSeed, ordinal) }, tuning, catalog);
    out.push(themeId);
    previous = themeId;
  }
  return out;
}

describe('selectPresentation (AD-15, Randomize)', () => {
  it('opens a profile in Kiln, the first-run theme', () => {
    for (const seed of [0, 1, 42, 0xffffffff]) expect(sequence(seed, 1, MIXED)).toEqual(['kiln']);
  });

  it('never repeats a theme in consecutive rounds while more than one is available', () => {
    for (const seed of [1, 7, 99, 123456, 0xdeadbeef]) {
      for (const catalog of [ZEN2, MIXED]) {
        const themes = sequence(seed, 300, catalog);
        for (let i = 1; i < themes.length; i += 1) expect(themes[i], `seed ${seed} round ${i}`).not.toBe(themes[i - 1]);
      }
    }
  });

  it('alternates Kiln and Moonwater with two Zen themes', () => {
    expect(sequence(5, 6, ZEN2)).toEqual(['kiln', 'moonwater', 'kiln', 'moonwater', 'kiln', 'moonwater']);
  });

  it('is deterministic per rootSeed, whatever order the catalogue is in', () => {
    expect(sequence(2024, 50, MIXED)).toEqual(sequence(2024, 50, [...MIXED].reverse()));
    expect(sequence(2024, 50, MIXED)).toEqual(sequence(2024, 50, MIXED));
  });

  it('draws from every Zen theme over many rounds, and only from Zen themes', () => {
    const seen = new Set(sequence(31337, 300, MIXED));
    expect([...seen].sort()).toEqual(['kiln', 'moonwater', 'washi-ink']);
  });

  it('keeps the one theme there is, and falls back to Kiln with no Zen theme', () => {
    expect(sequence(3, 4, [{ themeId: 'moonwater', mode: 'zen' }])).toEqual(['moonwater', 'moonwater', 'moonwater', 'moonwater']);
    expect(sequence(3, 2, [{ themeId: 'vector-noir', mode: 'normal' }])).toEqual(['kiln', 'kiln']);
    expect(sequence(3, 2, [])).toEqual(['kiln', 'kiln']);
  });

  it('draws after a previous theme the catalogue no longer has', () => {
    const { themeId } = selectPresentation({ mode: 'zen', previousThemeId: 'gone', roundSeed: 77 }, tuning, ZEN2);
    expect(['kiln', 'moonwater']).toContain(themeId);
  });
});

describe('selectPresentation: Playlist', () => {
  const pick = (previousThemeId: string | null, playlist: readonly string[], catalog: Entry[] = MIXED) =>
    selectPresentation({ mode: 'zen', previousThemeId, roundSeed: 1, selection: 'playlist', playlist }, tuning, catalog).themeId;

  it('starts at the top, then follows the order after the previous theme, wrapping', () => {
    const list = ['washi-ink', 'moonwater', 'kiln'];
    expect(pick(null, list)).toBe('washi-ink');
    expect(pick('washi-ink', list)).toBe('moonwater');
    expect(pick('moonwater', list)).toBe('kiln');
    expect(pick('kiln', list)).toBe('washi-ink');
  });

  it('never repeats consecutively over a long run while the playlist holds two or more themes', () => {
    const list = ['kiln', 'moonwater'];
    let previous: string | null = null;
    for (let k = 0; k < 20; k += 1) {
      const next = pick(previous, list);
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it('skips ids not in the mode pool, starts from the top after a theme not on it, and is Randomize with none left', () => {
    expect(pick('kiln', ['vector-noir', 'moonwater', 'nowhere', 'washi-ink'])).toBe('moonwater');
    expect(pick('moonwater', ['vector-noir', 'moonwater', 'nowhere', 'washi-ink'])).toBe('washi-ink');
    const randomize = selectPresentation({ mode: 'zen', previousThemeId: 'kiln', roundSeed: 1 }, tuning, MIXED).themeId;
    expect(pick('kiln', ['vector-noir'])).toBe(randomize);
    expect(pick('kiln', [])).toBe(randomize);
  });

  it('with one theme on it, plays that one every round', () => {
    expect(pick('moonwater', ['moonwater'])).toBe('moonwater');
  });
});

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

describe('selectPresentation: transitions (AD-15, FR-26)', () => {
  const t = (transitionId: string, tag: 'calm' | 'intense' = 'calm') =>
    ({ kind: 'Transition', schemaVersion: 1, transitionId, name: transitionId, tag, start: 'after-tap', maxFlashesPerSecond: 1, audioCue: 'whoosh' }) as const;
  const LIBRARY = [t('crossfade'), t('fade'), t('interpolate'), t('ripple'), t('snow'), t('radiate', 'intense'), t('fracture', 'intense')];
  const CALM = ['fade', 'interpolate', 'ripple', 'snow'];
  type Req = Parameters<typeof selectPresentation>[0];
  const draw = (over: Partial<Req>, catalog = LIBRARY) =>
    selectPresentation({ mode: 'zen', previousThemeId: 'kiln', roundSeed: 1, ...over }, tuning, ZEN2, catalog).transitionId;
  /** A run of transitions from `rootSeed`, each drawn after the last. */
  const run = (rootSeed: number, count: number, over: Partial<Req>) => {
    const out: string[] = [];
    let previous: string | null = null;
    for (let ordinal = 0; ordinal < count; ordinal += 1) {
      const id = draw({ ...over, roundSeed: deriveSeed(rootSeed, ordinal), previousTransitionId: previous });
      out.push(id);
      previous = id;
    }
    return out;
  };

  it('Zen and Calm only ever pick calm transitions, and never the Minimal crossfade', () => {
    for (const motion of ['full', 'calm'] as const) {
      for (const seed of [1, 99, 0xdeadbeef]) {
        const ids = run(seed, 300, { motion });
        for (const id of ids) expect(CALM).toContain(id);
        expect([...new Set(ids)].sort()).toEqual(CALM);
      }
    }
    // Normal at Calm: calm only too.
    for (const id of run(4, 200, { mode: 'normal', motion: 'calm' })) expect(CALM).toContain(id);
  });

  it('Minimal always crossfades, in every mode and with any override', () => {
    for (const mode of ['zen', 'normal'] as const) {
      for (const id of run(7, 50, { mode, motion: 'minimal', transitionOverride: 'ripple' })) expect(id).toBe('crossfade');
    }
    expect(draw({ motion: 'minimal' }, [])).toBe('crossfade');
  });

  it('only Normal at Full may draw intense transitions', () => {
    const ids = new Set(run(12, 300, { mode: 'normal', motion: 'full' }));
    expect(ids.has('radiate') || ids.has('fracture')).toBe(true);
    expect(ids.has('crossfade')).toBe(false);
  });

  it('never repeats the previous round change’s transition while another is available', () => {
    for (const seed of [3, 5, 8]) {
      const ids = run(seed, 300, { motion: 'calm' });
      for (let i = 1; i < ids.length; i += 1) expect(ids[i]).not.toBe(ids[i - 1]);
    }
    expect(run(3, 4, { motion: 'calm' })).toEqual(run(3, 4, { motion: 'calm' }));
  });

  it('keeps the one calm transition there is, and falls back to interpolate with none', () => {
    expect(draw({ motion: 'calm', previousTransitionId: 'ripple' }, [t('ripple'), t('crossfade')])).toBe('ripple');
    expect(draw({ motion: 'calm' }, [t('crossfade'), t('radiate', 'intense')])).toBe('interpolate');
    expect(draw({ motion: 'calm' }, [])).toBe('interpolate');
  });

  it('takes an override in the pool, and ignores one that is not', () => {
    expect(draw({ motion: 'calm', transitionOverride: 'snow', previousTransitionId: 'snow' })).toBe('snow');
    expect(CALM).toContain(draw({ motion: 'calm', transitionOverride: 'radiate' }));
    expect(CALM).toContain(draw({ motion: 'calm', transitionOverride: 'nowhere' }));
  });

  it('leaves the theme draw as it was', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const plain = selectPresentation({ mode: 'zen', previousThemeId: 'kiln', roundSeed: seed }, tuning, MIXED).themeId;
      const withTransitions = selectPresentation({ mode: 'zen', previousThemeId: 'kiln', roundSeed: seed, motion: 'calm', previousTransitionId: 'fade' }, tuning, MIXED, LIBRARY).themeId;
      expect(withTransitions).toBe(plain);
    }
  });
});

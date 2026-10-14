import { KILN_TOKENS, type ThemeTokens } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { relativeLuminance } from './round-change';
import { clumpScale, flakeAt, MAX_CLUMPS, MAX_FLAKES, SNOW_COVERED, SNOW_MELT, SNOW_SWAP, snowColors, snowField } from './snow-field';

const MOON: ThemeTokens = { ...KILN_TOKENS, themeId: 'moonwater', surface: '#16242C', accent: '#BFE3DA' };
const DUNE: ThemeTokens = { ...KILN_TOKENS, themeId: 'dune', surface: '#E8D9B8' };
const FRAMES: [number, number, [number, number]][] = [
  [390, 844, [195, 420]],
  [390, 844, [40, 800]],
  [1280, 720, [640, 360]],
  [320, 568, [300, 20]],
];

/** True when (x, y) is under a clump at progress `p`. */
function covered(field: ReturnType<typeof snowField>, x: number, y: number, p: number): boolean {
  return field.clumps.some((c) => Math.hypot(x - c.x, y - c.y) <= c.r * clumpScale(c, p));
}

describe('snowField', () => {
  it.each(FRAMES)('%i × %i: stays within the particle budget, deterministic', (w, h, tap) => {
    const field = snowField(w, h, tap);
    expect(field.clumps.length).toBeLessThanOrEqual(MAX_CLUMPS);
    expect(field.flakes.length).toBeLessThanOrEqual(MAX_FLAKES);
    expect(snowField(w, h, tap)).toEqual(field);
  });

  it.each(FRAMES)('%i × %i: blankets the whole frame by the swap, and is melted away by the end', (w, h, tap) => {
    const field = snowField(w, h, tap);
    for (let x = 0; x <= w; x += w / 24) {
      for (let y = 0; y <= h; y += h / 24) {
        expect(covered(field, x, y, SNOW_COVERED), `(${x}, ${y})`).toBe(true);
        expect(covered(field, x, y, SNOW_SWAP)).toBe(true);
      }
    }
    for (const c of field.clumps) {
      expect(c.land).toBeLessThanOrEqual(0.48);
      expect(c.melt).toBeGreaterThanOrEqual(SNOW_MELT);
      expect(clumpScale(c, 1)).toBe(0);
      expect(clumpScale(c, 0)).toBe(0);
    }
  });

  it('melts outward from the tap point', () => {
    const [w, h, tap] = FRAMES[1] as (typeof FRAMES)[number];
    const field = snowField(w, h, tap);
    const byDistance = [...field.clumps].sort((a, b) => Math.hypot(a.x - tap[0], a.y - tap[1]) - Math.hypot(b.x - tap[0], b.y - tap[1]));
    const third = Math.floor(byDistance.length / 3);
    const mean = (cs: typeof byDistance) => cs.reduce((s, c) => s + c.melt, 0) / cs.length;
    expect(mean(byDistance.slice(0, third))).toBeLessThan(mean(byDistance.slice(-third)));
  });

  it('flakes fall onto their clumps as those land', () => {
    const field = snowField(390, 844, [195, 420]);
    const c = field.clumps[0];
    const f = field.flakes[0];
    if (c === undefined || f === undefined) throw new Error('empty field');
    const landed = flakeAt(f, f.t1);
    expect(landed?.[1]).toBeCloseTo(c.y);
    // It sways at most 6 px either side of its line.
    expect(Math.abs((landed?.[0] ?? 0) - c.x)).toBeLessThanOrEqual(6 + 1e-9);
    expect(flakeAt(f, f.t1 + 0.01)).toBeNull();
    expect(f.t1).toBe(c.land);
  });
});

describe('snowColors', () => {
  it('falls as snow onto a light theme and as embers into ash onto a dark one', () => {
    expect(snowColors(MOON, KILN_TOKENS, false).embers).toBe(false);
    expect(snowColors(KILN_TOKENS, MOON, false).embers).toBe(true);
    expect(snowColors(KILN_TOKENS, MOON, false).accent).toBe(MOON.accent);
  });

  it('bridges a light ↔ dark change with a mid-luminance blanket, so each pixel goes old → mid → new', () => {
    for (const [a, b] of [
      [KILN_TOKENS, MOON],
      [MOON, KILN_TOKENS],
    ] as const) {
      const [la, lb] = [relativeLuminance(a.surface), relativeLuminance(b.surface)];
      const blanket = relativeLuminance(snowColors(a, b, true).blanket);
      expect(blanket).toBeGreaterThan(Math.min(la, lb) + 0.05 * Math.abs(la - lb));
      expect(blanket).toBeLessThan(Math.max(la, lb) - 0.05 * Math.abs(la - lb));
    }
    // Light to light keeps the snow white-ish: lighter than the destination.
    expect(relativeLuminance(snowColors(KILN_TOKENS, DUNE, false).blanket)).toBeGreaterThan(relativeLuminance(DUNE.surface));
  });
});

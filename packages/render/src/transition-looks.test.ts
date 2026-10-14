import { KILN_TOKENS, type ThemeTokens } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { mixOklch } from './oklch';
import { blendTheme, relativeLuminance } from './round-change';
import { crossesLightDark, FADE_RESOLVE, fadeLook, farthestCorner, RIPPLE_REACH, rippleLook, transitionStyle } from './transition-looks';

const MOON: ThemeTokens = { ...KILN_TOKENS, themeId: 'moonwater', surface: '#16242C', cellFill: '#223943', accent: '#BFE3DA', solvedFill: '#384A4F' };
const DUNE: ThemeTokens = { ...KILN_TOKENS, themeId: 'dune', surface: '#E8D9B8' };
const steps = Array.from({ length: 401 }, (_, i) => i / 400);

/** Total luminance change against the direction of travel (0 when monotonic), ignoring 8-bit rounding. */
function reversal(lum: readonly number[]): number {
  const sign = Math.sign((lum.at(-1) ?? 0) - (lum[0] ?? 0));
  let back = 0;
  for (let i = 1; i < lum.length; i += 1) {
    const d = sign * ((lum[i] ?? 0) - (lum[i - 1] ?? 0));
    if (d < -1e-3) back -= d;
  }
  return back;
}

describe('transitionStyle', () => {
  it('draws each calm transition by id, and anything else as token interpolation', () => {
    for (const id of ['interpolate', 'crossfade', 'fade', 'ripple', 'snow'] as const) expect(transitionStyle(id)).toBe(id);
    expect(transitionStyle('default')).toBe('interpolate');
    expect(transitionStyle('radiate')).toBe('interpolate');
  });

  it('tells a light ↔ dark change apart', () => {
    expect(crossesLightDark(KILN_TOKENS, MOON)).toBe(true);
    expect(crossesLightDark(MOON, KILN_TOKENS)).toBe(true);
    expect(crossesLightDark(KILN_TOKENS, DUNE)).toBe(false);
  });
});

describe('fadeLook', () => {
  it('starts on the old round and ends on the new one, settling from large', () => {
    expect(fadeLook(0)).toMatchObject({ color: 0, fromAlpha: 1, toAlpha: 0, fromScale: 1, toScale: FADE_RESOLVE });
    expect(fadeLook(1)).toMatchObject({ color: 1, fromAlpha: 0, toAlpha: 1, toScale: 1 });
  });

  it('has the new layer opaque before the old one fades', () => {
    for (const p of steps) {
      const look = fadeLook(p);
      if (look.fromAlpha < 1) expect(look.toAlpha).toBeGreaterThan(0.99);
    }
  });

  it('moves the surface one way through mid-luminance, both ways', () => {
    for (const [a, b] of [
      [KILN_TOKENS, MOON],
      [MOON, KILN_TOKENS],
    ] as const) {
      const lum = steps.map((p) => relativeLuminance(mixOklch(a.surface, b.surface, fadeLook(p).color)));
      expect(reversal(lum)).toBe(0);
      expect(lum.some((l) => l > 0.1 && l < 0.4)).toBe(true);
    }
  });
});

describe('rippleLook', () => {
  it('grows from the tap to the farthest corner by RIPPLE_REACH, never accelerating', () => {
    const reach = steps.map((p) => rippleLook(p, false).reach);
    expect(reach[0]).toBe(0);
    expect(rippleLook(RIPPLE_REACH, false).reach).toBe(1);
    for (let i = 2; i < reach.length; i += 1) {
      expect(reach[i]).toBeGreaterThanOrEqual(reach[i - 1] ?? 0);
      // Ease-out: each step is no bigger than the last.
      expect((reach[i] ?? 0) - (reach[i - 1] ?? 0)).toBeLessThanOrEqual((reach[i - 1] ?? 0) - (reach[i - 2] ?? 0) + 1e-9);
    }
    expect(farthestCorner([0, 0], 300, 400)).toBe(500);
  });

  it('draws each side in its own theme when no light ↔ dark change is bridged', () => {
    for (const p of steps) expect(rippleLook(p, false)).toMatchObject({ oldBlend: 0, newBlend: 1 });
    expect(rippleLook(1, false).rings).toBe(0);
  });

  for (const [name, a, b] of [
    ['Kiln → Moonwater', KILN_TOKENS, MOON],
    ['Moonwater → Kiln', MOON, KILN_TOKENS],
  ] as const) {
    it(`${name}: every pixel's surface moves one way as the front passes it, and the frame passes mid-luminance`, () => {
      const lo = Math.min(relativeLuminance(a.surface), relativeLuminance(b.surface));
      const hi = Math.max(relativeLuminance(a.surface), relativeLuminance(b.surface));
      // Pixels at these shares of the farthest-corner distance from the tap.
      for (const d of [0, 0.1, 0.4, 0.7, 0.99]) {
        const lum = steps.map((p) => {
          const look = rippleLook(p, true);
          const side = look.reach > d ? look.newBlend : look.oldBlend;
          return relativeLuminance(blendTheme(a, b, side, mixOklch).surface);
        });
        expect(reversal(lum), `d ${d}`).toBe(0);
        expect(lum[0]).toBeCloseTo(relativeLuminance(a.surface), 5);
        expect(lum.at(-1)).toBeCloseTo(relativeLuminance(b.surface), 5);
      }
      // Some frame has both sides between a fifth and four fifths of the way (mid-luminance).
      const mid = (l: number) => l > lo + 0.05 * (hi - lo) && l < hi - 0.05 * (hi - lo);
      const midFrame = steps.some((p) => {
        const look = rippleLook(p, true);
        return mid(relativeLuminance(blendTheme(a, b, look.oldBlend, mixOklch).surface)) && mid(relativeLuminance(blendTheme(a, b, look.newBlend, mixOklch).surface));
      });
      expect(midFrame).toBe(true);
    });
  }
});

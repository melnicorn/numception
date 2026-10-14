import { KILN_TOKENS, type ThemeTokens } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { ARRIVE_SCALE, blendTheme, inTheme, LEAVE_SCALE, mixHex, relativeLuminance, roundChangeLook, scaleAbout } from './round-change';

/** Moonwater's colour rows (content/themes/moonwater.json), over Kiln's other tokens. */
const MOON: ThemeTokens = {
  ...KILN_TOKENS,
  themeId: 'moonwater',
  surface: '#16242C',
  cellFill: '#223943',
  line: '#738D8C',
  lineWidth: 2.5,
  number: '#B1D4CC',
  solvedFill: '#384A4F',
  solvedNumber: '#BFE3DA',
  fontFamily: 'ui-rounded, sans-serif',
  fontWeight: '300',
};

const steps = Array.from({ length: 121 }, (_, i) => i / 120);

describe('roundChangeLook', () => {
  it('starts on the old round and ends on the new one', () => {
    expect(roundChangeLook(0)).toEqual({ color: 0, fromAlpha: 1, fromScale: 1, toAlpha: 0, toScale: ARRIVE_SCALE });
    expect(roundChangeLook(1)).toEqual({ color: 1, fromAlpha: 0, fromScale: LEAVE_SCALE, toAlpha: 1, toScale: 1 });
  });

  it('the old board leaves (shrinking) before half-way and the new one grows in after it, never both at full strength', () => {
    for (const p of steps) {
      const look = roundChangeLook(p);
      if (p >= 0.7) expect(look.fromAlpha).toBe(0);
      if (p <= 0.7) expect(look.toAlpha).toBe(0);
      // Nothing leaves or arrives before the colours are done.
      if (look.fromAlpha < 1 || look.fromScale < 1 || look.toAlpha > 0) expect(look.color).toBe(1);
      expect(look.fromAlpha + look.toAlpha).toBeLessThanOrEqual(1.2);
    }
    // Scales move one way only: the leave shrinks, the arrival grows, never accelerating at the end.
    const looks = steps.map(roundChangeLook);
    for (let i = 1; i < looks.length; i += 1) {
      expect((looks[i] as ReturnType<typeof roundChangeLook>).fromScale).toBeLessThanOrEqual((looks[i - 1] as ReturnType<typeof roundChangeLook>).fromScale);
      expect((looks[i] as ReturnType<typeof roundChangeLook>).toScale).toBeGreaterThanOrEqual((looks[i - 1] as ReturnType<typeof roundChangeLook>).toScale);
    }
  });
});

/** WCAG sRGB over-compositing of `top` at `alpha` on `under`, as #RRGGBB. */
function over(under: string, top: string, alpha: number): string {
  return mixHex(under, top, alpha);
}

/**
 * A pixel of the frame at progress `p`, composed as the renderer draws it: the
 * frame surface; the old top (role `oldRole` of the frame theme) if the pixel at
 * distance `r` from the frame centre is inside its footprint (radius 1 × its
 * scale); the new board (role `newRole`) if inside its footprint (radius `newR`
 * × its scale).
 */
function pixel(p: number, from: ThemeTokens, to: ThemeTokens, r: number, oldRole: keyof ThemeTokens | null, newRole: keyof ThemeTokens | null, newR = 1): number {
  const look = roundChangeLook(p);
  const theme = blendTheme(from, to, look.color);
  let color = theme.surface;
  if (oldRole !== null && r <= look.fromScale && look.fromAlpha > 0) color = over(color, theme[oldRole] as string, look.fromAlpha);
  if (newRole !== null && r <= newR * look.toScale && look.toAlpha > 0) color = over(color, theme[newRole] as string, look.toAlpha);
  return relativeLuminance(color);
}

/**
 * The luminance changes of a pixel over the beat, merged into runs of one
 * direction; returns each run's total change. Steps under 0.001 (8-bit channel
 * rounding, invisible) are left out.
 */
function runs(lum: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < lum.length; i += 1) {
    const d = (lum[i] ?? 0) - (lum[i - 1] ?? 0);
    if (Math.abs(d) < 1e-3) continue;
    const last = out[out.length - 1];
    if (last !== undefined && Math.sign(last) === Math.sign(d)) out[out.length - 1] = last + d;
    else out.push(d);
  }
  return out;
}

describe('board pixels over the round change (Accessibility Floor)', () => {
  const fine = Array.from({ length: 401 }, (_, i) => i / 400);
  for (const [name, a, b] of [
    ['Kiln → Moonwater', KILN_TOKENS, MOON],
    ['Moonwater → Kiln', MOON, KILN_TOKENS],
  ] as const) {
    it(`${name}: the field and the old top's footprint change luminance one way only`, () => {
      // Pixels the old fused tile covers at rest and uncovers as it shrinks (r between 0.7 and 1), and the open field.
      const samples: [number, keyof ThemeTokens | null][] = [
        [0.85, 'solvedFill'],
        [0.95, 'solvedFill'],
        [0.3, 'solvedFill'],
        [1.5, null],
      ];
      for (const [r, role] of samples) {
        const lum = fine.map((p) => pixel(p, a, b, r, role, null));
        expect(runs(lum).length, `r ${r} ${String(role)}: ${runs(lum).map((x) => x.toFixed(3)).join(', ')}`).toBeLessThanOrEqual(1);
      }
    });

    it(`${name}: a pixel the old top leaves and the new board covers changes back at most once (one flash at most, far under 3 per second)`, () => {
      for (const [r, oldRole, newRole] of [
        [0.85, 'solvedFill', 'cellFill'],
        [0.85, 'solvedFill', 'line'],
        [0.1, 'solvedNumber', 'operator'],
        [0.1, 'solvedNumber', null],
        [1.5, null, 'cellFill'],
        [1.5, null, 'number'],
      ] as const) {
        // WCAG: a flash is a pair of opposing changes of 10 % luminance. The new
        // board's ink arriving on the new surface is the only change back.
        const big = runs(fine.map((p) => pixel(p, a, b, r, oldRole, newRole, 2))).filter((x) => Math.abs(x) >= 0.1);
        expect(big.length, `${r} ${oldRole} → ${newRole}: ${big.map((x) => x.toFixed(3)).join(', ')}`).toBeLessThanOrEqual(2);
      }
    });
  }
});

describe('the whole-frame theme change', () => {
  const surfaces = steps.map((p) => blendTheme(KILN_TOKENS, MOON, roundChangeLook(p).color).surface);

  it('moves the surface from the old theme to the new one', () => {
    expect(surfaces[0]).toBe(KILN_TOKENS.surface);
    expect(surfaces.at(-1)).toBe(MOON.surface);
  });

  it('light to dark passes through a mid-luminance frame, with one monotonic change (no flash)', () => {
    const lum = surfaces.map(relativeLuminance);
    // Mid luminance: between the two ends' contrast midpoint, here 0.1–0.3 (Kiln ≈ 0.77, Moonwater ≈ 0.016).
    expect(lum.some((l) => l > 0.1 && l < 0.3)).toBe(true);
    for (let i = 1; i < lum.length; i += 1) expect(lum[i]).toBeLessThanOrEqual((lum[i - 1] ?? 1) + 1e-9);
    // And dark to light the other way round.
    const back = steps.map((p) => relativeLuminance(blendTheme(MOON, KILN_TOKENS, roundChangeLook(p).color).surface));
    for (let i = 1; i < back.length; i += 1) expect(back[i]).toBeGreaterThanOrEqual((back[i - 1] ?? 0) - 1e-9);
  });

  it('tweens every colour, width and size, and swaps the face at half-way', () => {
    const mid = blendTheme(KILN_TOKENS, MOON, 0.5);
    expect(mid.cellFill).toBe(mixHex(KILN_TOKENS.cellFill, MOON.cellFill, 0.5));
    expect(mid.line).toBe(mixHex(KILN_TOKENS.line, MOON.line, 0.5));
    expect(mid.lineWidth).toBeCloseTo(2);
    expect(mid.fontFamily).toBe(MOON.fontFamily);
    expect(blendTheme(KILN_TOKENS, MOON, 0.49).fontFamily).toBe(KILN_TOKENS.fontFamily);
    expect(blendTheme(KILN_TOKENS, MOON, 0)).toBe(KILN_TOKENS);
    expect(blendTheme(KILN_TOKENS, MOON, 1)).toBe(MOON);
  });

  it('mixes #RRGGBB colours', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mixHex('#ECE3D7', '#16242C', 0)).toBe('#ECE3D7');
    expect(mixHex('#ECE3D7', '#16242C', 1)).toBe('#16242C');
  });

  it('draws a view and its context parent in one theme', () => {
    const parent = { theme: KILN_TOKENS } as never;
    const view = inTheme({ theme: KILN_TOKENS, context: { parent, cellIndex: 0, camera: { x: 0, y: 0, width: 1, height: 1 } } } as never, MOON);
    expect(view.theme).toBe(MOON);
    expect(view.context?.parent.theme).toBe(MOON);
  });

  it('scales a transform about a frame point, which stays put', () => {
    const t = { scale: 300, left: 40, top: 100, aspect: 1 };
    const s = scaleAbout(t, 0.5, 195, 400);
    expect(s.scale).toBe(150);
    // The frame point maps to the same unit point before and after.
    const unit = [(195 - t.left) / t.scale, (400 - t.top) / t.scale];
    expect(s.left + (unit[0] ?? 0) * s.scale).toBeCloseTo(195);
    expect(s.top + (unit[1] ?? 0) * s.scale).toBeCloseTo(400);
  });
});

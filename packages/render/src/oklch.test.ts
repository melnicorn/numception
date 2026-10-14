import { describe, expect, it } from 'vitest';
import { hexToOklab, mixOklch, oklabToHex } from './oklch';
import { relativeLuminance } from './round-change';

describe('OKLCH mixing', () => {
  it('round-trips sRGB through OKLab', () => {
    for (const hex of ['#000000', '#FFFFFF', '#ECE3D7', '#16242C', '#A14E36', '#BFE3DA']) expect(oklabToHex(hexToOklab(hex))).toBe(hex);
    expect(hexToOklab('#FFFFFF')[0]).toBeCloseTo(1, 3);
  });

  it('is exact at the ends and moves lightness evenly between them', () => {
    expect(mixOklch('#ECE3D7', '#16242C', 0)).toBe('#ECE3D7');
    expect(mixOklch('#ECE3D7', '#16242C', 1)).toBe('#16242C');
    const mid = hexToOklab(mixOklch('#ECE3D7', '#16242C', 0.5))[0];
    expect(mid).toBeCloseTo((hexToOklab('#ECE3D7')[0] + hexToOklab('#16242C')[0]) / 2, 2);
  });

  it('moves luminance one way only between the Kiln and Moonwater roles', () => {
    const pairs = [
      ['#ECE3D7', '#16242C'],
      ['#F6F0E8', '#223943'],
      ['#AC644E', '#738D8C'],
      ['#994A33', '#B1D4CC'],
      ['#A14E36', '#384A4F'],
      ['#F6F0E8', '#BFE3DA'],
    ];
    for (const [a, b] of pairs) {
      const lum = Array.from({ length: 101 }, (_, i) => relativeLuminance(mixOklch(a as string, b as string, i / 100)));
      const sign = Math.sign((lum[100] ?? 0) - (lum[0] ?? 0));
      for (let i = 1; i < lum.length; i += 1) expect(sign * ((lum[i] ?? 0) - (lum[i - 1] ?? 0)), `${a} → ${b} at ${i}`).toBeGreaterThanOrEqual(-2e-3);
    }
  });
});

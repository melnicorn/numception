import type { PlayVM } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { numeralSize } from './numeral-size';
import { fitView, GUTTER_PX, toScreen, toUnit } from './view-transform';

// 3A's outline (core/layout): apex (0.5, 0), base corners at y = 0.75.
const s3 = Math.sqrt(3) / 4;
const vm3A: Pick<PlayVM, 'aspect' | 'cells' | 'operator'> = {
  aspect: 1,
  cells: [
    {
      index: 0,
      polygon: [
        [0.5, 0],
        [0.5 + s3, 0.75],
        [0.5 - s3, 0.75],
      ],
      labelPoint: [0.5, 0.5],
      inscribedRadius: 0.125,
      text: '1',
      state: 'unsolved',
    },
  ],
  operator: { polygon: [], labelPoint: [0.5, 0.5], symbol: '+' },
};

describe('fitView', () => {
  it('fits the shape inside the gutter on a 375 × 667 phone, centred', () => {
    const t = fitView(vm3A, 375, 667);
    const apex = toScreen(t, [0.5, 0]);
    const left = toScreen(t, [0.5 - s3, 0.75]);
    const right = toScreen(t, [0.5 + s3, 0.75]);
    expect(left[0]).toBeCloseTo(GUTTER_PX, 6);
    expect(right[0]).toBeCloseTo(375 - GUTTER_PX, 6);
    expect(apex[0]).toBeCloseTo(187.5, 6);
    // Vertically centred: equal space above the apex and below the base.
    expect(apex[1]).toBeCloseTo(667 - left[1], 6);
  });

  it('is limited by height in a wide frame, and keeps the gutter', () => {
    const t = fitView(vm3A, 1280, 720);
    expect(toScreen(t, [0.5, 0])[1]).toBeCloseTo(GUTTER_PX, 6);
    expect(toScreen(t, [0.5, 0.75])[1]).toBeCloseTo(720 - GUTTER_PX, 6);
  });

  it('toUnit inverts toScreen', () => {
    const t = fitView({ ...vm3A, aspect: 0.8 }, 400, 900);
    const p = toUnit(t, toScreen(t, [0.3, 0.6]));
    expect(p[0]).toBeCloseTo(0.3, 9);
    expect(p[1]).toBeCloseTo(0.6, 9);
  });

  it('never divides by zero for an empty frame', () => {
    const t = fitView(vm3A, 0, 0);
    expect(Number.isFinite(t.scale) && t.scale > 0).toBe(true);
  });
});

describe('numeralSize', () => {
  it('is capped at 44 px at n = 3 on a 375-wide phone', () => {
    const t = fitView(vm3A, 375, 667);
    expect(numeralSize({ numberSizePx: 44 }, t, 0.125, 375)).toBe(44);
  });

  it('follows about 1.1 × the inscribed radius when that is smaller, never below 20 px', () => {
    const t = { scale: 200, left: 0, top: 0, aspect: 1 };
    expect(numeralSize({ numberSizePx: 44 }, t, 0.125, 375)).toBeCloseTo(27.5, 6);
    expect(numeralSize({ numberSizePx: 44 }, { ...t, scale: 50 }, 0.125, 375)).toBe(20);
  });
});

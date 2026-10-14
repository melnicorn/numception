import { describe, expect, it } from 'vitest';
import { ARROW_ALPHA, ARROW_HEAD_PX, ARROW_INSET, arrowAlpha, ghostArrow, PULSE_SWELL_PX, pulseLook, pulseStrength } from './soft-miss-motion';

describe('soft-miss pulse', () => {
  it('swells once and fades to nothing: 0 at the start and end, peak at 30 %', () => {
    expect(pulseStrength(0)).toBe(0);
    expect(pulseStrength(0.3)).toBe(1);
    expect(pulseStrength(1)).toBe(0);
    expect(pulseStrength(0.65)).toBeCloseTo(0.5);
    // Rises then only falls: one pulse.
    let peaked = false;
    let last = -1;
    for (let i = 0; i <= 100; i += 1) {
      const s = pulseStrength(i / 100);
      if (!peaked && s < last) peaked = true;
      if (peaked) expect(s).toBeLessThanOrEqual(last + 1e-12);
      last = s;
    }
  });

  it('swells the outline by PULSE_SWELL_PX at the peak and is the plain outline at rest', () => {
    expect(pulseLook(0.3, 1.5)).toEqual({ width: 1.5 + PULSE_SWELL_PX, alpha: 1, washAlpha: expect.any(Number) });
    expect(pulseLook(1, 1.5)).toEqual({ width: 1.5, alpha: 0, washAlpha: 0 });
  });
});

describe('ghost arrow', () => {
  it('fades in, holds, and fades out by the end', () => {
    expect(arrowAlpha(0)).toBe(0);
    expect(arrowAlpha(0.3)).toBe(ARROW_ALPHA);
    expect(arrowAlpha(0.75)).toBeCloseTo(ARROW_ALPHA / 2);
    expect(arrowAlpha(1)).toBe(0);
  });

  it('runs from the tapped label toward the answer, clear of both numerals, with a symmetric head at the tip', () => {
    const a = ghostArrow([0, 0], [200, 0]);
    expect(a).not.toBeNull();
    if (a === null) return;
    expect(a.tail).toEqual([200 * ARROW_INSET, 0]);
    expect(a.tip).toEqual([200 * (1 - ARROW_INSET), 0]);
    // The arms point back from the tip at ±30°.
    expect(a.left[0]).toBeCloseTo(a.tip[0] - ARROW_HEAD_PX * Math.cos(Math.PI / 6));
    expect(a.right[0]).toBeCloseTo(a.left[0]);
    expect(a.left[1]).toBeCloseTo(-a.right[1]);
    expect(Math.abs(a.left[1])).toBeCloseTo(ARROW_HEAD_PX / 2);
  });

  it('follows any direction, and is null for coincident points', () => {
    const a = ghostArrow([100, 100], [100, 300]);
    expect(a?.tip[0]).toBeCloseTo(100);
    expect(a?.tip[1]).toBeCloseTo(300 - 200 * ARROW_INSET);
    expect((a?.left[1] ?? 0) < (a?.tip[1] ?? 0)).toBe(true);
    expect(ghostArrow([5, 5], [5, 5])).toBeNull();
  });
});

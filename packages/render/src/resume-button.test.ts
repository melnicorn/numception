import { describe, expect, it } from 'vitest';
import { RESUME_MIN_RADIUS_PX, resumeButton } from './resume-button';

describe('resumeButton', () => {
  it('centres a play button on the frame, scaled to its shorter side', () => {
    const b = resumeButton(390, 844);
    expect(b.center).toEqual([195, 422]);
    expect(b.radius).toBeCloseTo(390 * 0.11);
    // The triangle stays inside the circle.
    for (const [x, y] of b.triangle) expect(Math.hypot(x - 195, y - 422)).toBeLessThan(b.radius);
  });

  it('never shrinks below the minimum tap-friendly radius', () => {
    expect(resumeButton(200, 150).radius).toBe(RESUME_MIN_RADIUS_PX);
  });
});

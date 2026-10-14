import { describe, expect, it } from 'vitest';
import type { TuningConfig } from '../tuning/tuning-config';
import { beatDuration } from './beat-duration';

const tuning = {
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 },
} as TuningConfig;

describe('beatDuration', () => {
  it('reads each beat from the presentation section at Full motion', () => {
    expect(beatDuration('solve', tuning, 'full', false)).toBe(380);
    expect(beatDuration('advance', tuning, 'full', false)).toBe(400);
    expect(beatDuration('roundStart', tuning, 'full', false)).toBe(400);
    expect(beatDuration('collapse', tuning, 'full', true)).toBe(3000);
    expect(beatDuration('collapse', tuning, 'full', false)).toBe(1200);
    expect(beatDuration('idle', tuning, 'calm', true)).toBe(0);
  });

  it('scales non-collapse beats by calmMotionScale at Calm motion, rounded to integer ms', () => {
    expect(beatDuration('solve', tuning, 'calm', false)).toBe(475);
    expect(beatDuration('advance', tuning, 'calm', false)).toBe(500);
    expect(beatDuration('roundStart', tuning, 'calm', false)).toBe(500);
    const odd = { presentation: { ...tuning.presentation, solveMs: 333, calmMotionScale: 1.1 } } as TuningConfig;
    expect(beatDuration('solve', odd, 'calm', false)).toBe(366);
  });

  it('never scales a collapse, so FR-9 (≤ 3 s first, ≤ 1.2 s later) holds at Calm too', () => {
    expect(beatDuration('collapse', tuning, 'calm', true)).toBe(3000);
    expect(beatDuration('collapse', tuning, 'calm', false)).toBe(1200);
  });
});

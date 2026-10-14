import type { PlayVM } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { guideText } from './mount-guide-line';

const view = (kind: string, guideLine?: string) => ({ presentation: { kind }, ...(guideLine === undefined ? {} : { guideLine }) }) as unknown as PlayVM;

describe('guideText', () => {
  it('shows core’s guide line, but never during the round change', () => {
    expect(guideText(view('idle', 'Tap the answer'))).toBe('Tap the answer');
    expect(guideText(view('solve', 'Tap the answer'))).toBe('Tap the answer');
    expect(guideText(view('roundStart', 'Tap the answer'))).toBeUndefined();
    expect(guideText(view('idle'))).toBeUndefined();
    expect(guideText(null)).toBeUndefined();
  });
});

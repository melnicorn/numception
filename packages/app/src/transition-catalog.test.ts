import { BUILTIN_TRANSITIONS } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { loadTransitionCatalog } from './transition-catalog';

const t = (transitionId: string) => ({ kind: 'Transition', schemaVersion: 1, transitionId, name: transitionId, tag: 'calm', start: 'after-tap', maxFlashesPerSecond: 1, audioCue: 'whoosh' });

describe('loadTransitionCatalog', () => {
  it('loads every valid bundled transition, in file-name order', () => {
    const loaded = loadTransitionCatalog({ 'transitions/ripple.json': t('ripple'), 'transitions/fade.json': t('fade') });
    expect(loaded.transitions.map((x) => x.transitionId)).toEqual(['fade', 'ripple']);
    expect(loaded.rejected).toEqual([]);
  });

  it('leaves out a bad file, a misnamed one and a repeated id; the others still load', () => {
    const loaded = loadTransitionCatalog({
      'transitions/fade.json': t('fade'),
      'transitions/snow.json': { ...t('snow'), maxFlashesPerSecond: 9 },
      'transitions/other.json': t('ripple'),
      'transitions/z/fade.json': t('fade'),
    });
    expect(loaded.transitions.map((x) => x.transitionId)).toEqual(['fade']);
    expect(loaded.rejected.map((r) => r.source)).toEqual(['transitions/other.json', 'transitions/snow.json', 'transitions/z/fade.json']);
    expect(loaded.rejected[1]?.message).toMatch(/maxFlashesPerSecond: /);
  });

  it('falls back to the built-in catalogue when nothing loads', () => {
    expect(loadTransitionCatalog({}).transitions).toBe(BUILTIN_TRANSITIONS);
  });
});

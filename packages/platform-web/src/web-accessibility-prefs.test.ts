import { describe, expect, it } from 'vitest';
import { type LegacyFlagStorage, takeLegacyFeedbackFlags } from './legacy-feedback-flags';
import { type MotionQuery, REDUCED_MOTION_QUERY, webAccessibilityPrefs } from './web-accessibility-prefs';

class FakeQuery implements MotionQuery {
  matches: boolean;
  readonly listeners = new Set<() => void>();
  constructor(matches: boolean) {
    this.matches = matches;
  }
  addEventListener(_type: string, l: () => void) {
    this.listeners.add(l);
  }
  removeEventListener(_type: string, l: () => void) {
    this.listeners.delete(l);
  }
  set(matches: boolean) {
    this.matches = matches;
    for (const l of this.listeners) l();
  }
}

describe('webAccessibilityPrefs', () => {
  it('reports prefers-reduced-motion at start and on each change, until stopped', () => {
    const query = new FakeQuery(true);
    const asked: string[] = [];
    const seen: boolean[] = [];
    const stop = webAccessibilityPrefs((q) => (asked.push(q), query)).start((p) => seen.push(p.reduceMotion));
    expect(asked).toEqual([REDUCED_MOTION_QUERY]);
    expect(seen).toEqual([true]);
    query.set(false);
    expect(seen).toEqual([true, false]);
    stop();
    query.set(true);
    expect(seen).toEqual([true, false]);
  });

  it('reports Reduce Motion off without matchMedia', () => {
    const seen: boolean[] = [];
    webAccessibilityPrefs(undefined).start((p) => seen.push(p.reduceMotion));
    expect(seen).toEqual([false]);
  });
});

describe('takeLegacyFeedbackFlags', () => {
  function memory(): LegacyFlagStorage & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return { map, getItem: (k) => map.get(k) ?? null, removeItem: (k) => void map.delete(k) };
  }

  it('takes the stored boolean flags once and removes the key', () => {
    const storage = memory();
    storage.map.set('numception:feedback-flags:a', JSON.stringify({ effects: false, music: false, haptics: 'off' }));
    storage.map.set('numception:feedback-flags:b', JSON.stringify({ effects: true }));
    expect(takeLegacyFeedbackFlags('a', () => storage)).toEqual({ effects: false, music: false });
    expect(storage.map.has('numception:feedback-flags:a')).toBe(false);
    expect(takeLegacyFeedbackFlags('a', () => storage)).toBeNull();
    expect(storage.map.has('numception:feedback-flags:b')).toBe(true);
  });

  it('is null for missing, malformed or unreadable storage, never throwing', () => {
    const storage = memory();
    expect(takeLegacyFeedbackFlags('a', () => storage)).toBeNull();
    storage.map.set('numception:feedback-flags:a', '{not json');
    expect(takeLegacyFeedbackFlags('a', () => storage)).toBeNull();
    expect(storage.map.size).toBe(0);
    const broken: LegacyFlagStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {},
    };
    expect(takeLegacyFeedbackFlags('a', () => broken)).toBeNull();
    expect(takeLegacyFeedbackFlags('a', () => null)).toBeNull();
  });
});

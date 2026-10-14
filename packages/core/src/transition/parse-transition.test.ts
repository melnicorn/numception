import { describe, expect, it } from 'vitest';
import { parseTransition } from './parse-transition';
import { BUILTIN_TRANSITIONS, transitionById } from './transition-catalog';

const ripple = { kind: 'Transition', schemaVersion: 1, transitionId: 'ripple', name: 'Ripple', tag: 'calm', start: 'on-tap', maxFlashesPerSecond: 1, audioCue: 'whoosh' };

function issuesOf(json: unknown): readonly string[] {
  const parsed = parseTransition(json);
  if (parsed.ok) throw new Error('expected the transition to be rejected');
  if (parsed.error.code !== 'invalid-transition') throw new Error(parsed.error.code);
  return parsed.error.issues;
}

describe('parseTransition', () => {
  it('accepts a transition, frozen, and a null audio cue', () => {
    const parsed = parseTransition(ripple);
    expect(parsed).toEqual({ ok: true, value: ripple });
    expect(parsed.ok && Object.isFrozen(parsed.value)).toBe(true);
    expect(parseTransition({ ...ripple, audioCue: null }).ok).toBe(true);
  });

  it('rejects bad tags, starts, ids and cue ids, naming their path', () => {
    expect(issuesOf({ ...ripple, tag: 'wild' })[0]).toMatch(/^tag: /);
    expect(issuesOf({ ...ripple, start: 'later' })[0]).toMatch(/^start: /);
    expect(issuesOf({ ...ripple, transitionId: 'Ripple' })).toEqual(['transitionId: must be a lowercase kebab-case id']);
    expect(issuesOf({ ...ripple, audioCue: 'big-whoosh' })).toEqual(['audioCue: must be a camelCase cue id']);
  });

  it('caps maxFlashesPerSecond at 3 (AD-23), a whole number', () => {
    expect(parseTransition({ ...ripple, maxFlashesPerSecond: 3 }).ok).toBe(true);
    expect(issuesOf({ ...ripple, maxFlashesPerSecond: 4 })[0]).toMatch(/^maxFlashesPerSecond: /);
    expect(issuesOf({ ...ripple, maxFlashesPerSecond: 1.5 })[0]).toMatch(/^maxFlashesPerSecond: /);
    expect(issuesOf({ ...ripple, maxFlashesPerSecond: -1 })[0]).toMatch(/^maxFlashesPerSecond: /);
  });

  it('rejects unknown and missing keys (strict)', () => {
    expect(issuesOf({ ...ripple, durationMs: 900 })[0]).toMatch(/^durationMs: /);
    const { tag: _drop, ...missing } = ripple;
    expect(issuesOf(missing)[0]).toMatch(/^tag: /);
  });

  it('the built-in catalogue is valid: the crossfade and token interpolation', () => {
    for (const t of BUILTIN_TRANSITIONS) expect(parseTransition({ ...t }).ok).toBe(true);
    expect(transitionById(BUILTIN_TRANSITIONS, 'crossfade')?.tag).toBe('calm');
    expect(transitionById(BUILTIN_TRANSITIONS, 'ripple')).toBeUndefined();
  });
});

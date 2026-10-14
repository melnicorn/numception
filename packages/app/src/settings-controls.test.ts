import { type AppState, type Command, initialAppState, parseTuning, step } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { noAccessibilityPrefs } from './accessibility-prefs-port';
import { createSettingsControls } from './settings-controls';

const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add'],
    n: { min: 3, max: 3 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25, softMissMs: 600 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

describe('createSettingsControls', () => {
  it('reads the active profile’s settings and effective motion, and changes them through SetSetting', () => {
    let state: AppState = initialAppState();
    const dispatched: Command[] = [];
    const dispatch = (command: Command) => {
      dispatched.push(command);
      state = step(state, { command, ctx: { nowMs: 0, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: ['a', 'b'], seed32: [1, 2] } } }, tuning).state;
    };
    const controls = createSettingsControls(() => state, dispatch, ['kiln', 'moonwater']);
    expect(controls.get()).toBeNull();
    expect(controls.themeIds).toEqual(['kiln', 'moonwater']);
    dispatch({ type: 'StartSession' });
    expect(controls.get()).toMatchObject({ settings: { motion: 'calm', effects: true }, effectiveMotion: 'calm' });
    controls.set({ key: 'effects', value: false });
    expect(dispatched.at(-1)).toEqual({ type: 'SetSetting', key: 'effects', value: false });
    expect(controls.get()?.settings.effects).toBe(false);
    dispatch({ type: 'SetOsPreferences', reduceMotion: true });
    expect(controls.get()).toMatchObject({ settings: { motion: 'calm' }, effectiveMotion: 'minimal' });
  });

  it('reads and sets the dev transition override through SetTransitionOverride', () => {
    let state: AppState = initialAppState();
    const dispatch = (command: Command) => {
      state = step(state, { command, ctx: { nowMs: 0, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: ['a', 'b'], seed32: [1, 2] } } }, tuning).state;
    };
    const controls = createSettingsControls(() => state, dispatch, ['kiln'], ['fade', 'ripple']);
    expect(controls.transitionIds).toEqual(['fade', 'ripple']);
    expect(controls.transitionOverride()).toBeNull();
    controls.setTransitionOverride('ripple');
    expect(controls.transitionOverride()).toBe('ripple');
    controls.setTransitionOverride(null);
    expect(controls.transitionOverride()).toBeNull();
  });

  it('the no-op prefs port reports Reduce Motion off once', () => {
    const seen: boolean[] = [];
    noAccessibilityPrefs.start((p) => seen.push(p.reduceMotion))();
    expect(seen).toEqual([false]);
  });
});

import { describe, expect, it } from 'vitest';
import { MINIMAL_CROSSFADE_MS } from '../presentation/minimal-crossfade-ms';
import { effectiveMotion } from '../settings/effective-motion';
import { KILN_TOKENS } from '../theme/kiln-tokens';
import type { ThemeCatalog } from '../theme/theme-catalog';
import { parseTuning } from '../tuning/parse-tuning';
import { selectView } from '../view/select-view';
import type { AppState } from './app-state';
import type { Command } from './command';
import type { CommandContext } from './command-context';
import { KID_DEFAULTS } from './create-profile';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { initialAppState } from './initial-app-state';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { step } from './step';

// The AD-21 settings as commands (ticket 6.4): SetSetting for each per-profile
// setting, SetOsPreferences for OS Reduce Motion, and what they change in play.

const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 2,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 3 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 1200, collapseMs: 800, roundTransitionMs: 900, calmMotionScale: 1.25, softMissMs: 600 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

const theme = (themeId: string) => Object.freeze({ ...KILN_TOKENS, themeId, name: themeId });
const THEMES: ThemeCatalog = [KILN_TOKENS, theme('moonwater'), theme('washi-ink')];

function ctx(i: number): CommandContext {
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`a${i}`, `b${i}`], seed32: [777, i] } };
}

class Play {
  state: AppState = initialAppState();
  private i = 0;

  do(command: Command): readonly GameEvent[] {
    const r = step(this.state, { command, ctx: ctx(this.i++) }, tuning, THEMES);
    this.state = r.state;
    return r.events;
  }

  /** Dispatches a command that must not be rejected. */
  ok(command: Command): readonly GameEvent[] {
    const events = this.do(command);
    expect(events.filter((e) => e.type === 'CommandRejected')).toEqual([]);
    return events;
  }

  get game(): GameState {
    const g = this.state.profiles[this.state.activeProfileId ?? ''];
    if (g === undefined) throw new Error('no profile');
    return g;
  }

  get round(): Round {
    const r = this.game.rounds.byId[this.game.rounds.activeRoundId ?? ''];
    if (r === undefined) throw new Error('no round');
    return r;
  }

  /** Taps the answer in view; returns the beat it starts. */
  tapAnswer(): Round['presentation'] {
    const node = this.round.viewPath[this.round.viewPath.length - 1];
    const puzzle = node === undefined ? undefined : roundPuzzle(this.round, node);
    if (node === undefined || puzzle === undefined) throw new Error('no puzzle in view');
    this.ok({ type: 'TapCell', nodeId: node, cellIndex: puzzle.answerIndex });
    return this.round.presentation;
  }

  /** Ticks out the running beat; returns the beat that follows. */
  finishBeat(): Round['presentation'] {
    const p = this.round.presentation;
    this.ok({ type: 'Tick', elapsedMs: p.startedAtMs + p.durationMs - this.game.clockMs });
    return this.round.presentation;
  }

  /** Solves the puzzle in view and every beat after it; returns each beat after the solve beat. */
  solve(): Round['presentation'][] {
    this.tapAnswer();
    const beats: Round['presentation'][] = [];
    for (let p = this.finishBeat(); p.kind !== 'idle'; p = this.finishBeat()) beats.push(p);
    return beats;
  }

  /** Plays the round out (Classic or Tower); returns the next round's theme. */
  finishRound(): string {
    const id = this.round.roundId;
    for (let guard = 0; this.round.roundId === id; guard += 1) {
      if (guard > 40) throw new Error('no round change');
      this.solve();
    }
    return this.round.themeId;
  }
}

function started(): Play {
  const play = new Play();
  play.ok({ type: 'StartSession' });
  return play;
}

describe('SetSetting', () => {
  it('a new profile has the Kid defaults: Calm, Randomize with an empty playlist, effects and haptics on, music off', () => {
    expect(started().game.settings).toEqual({
      mode: 'zen',
      motion: 'calm',
      themeSelection: 'randomize',
      playlist: [],
      effects: true,
      music: false,
      haptics: true,
    });
  });

  it.each([
    ['motion', 'minimal'],
    ['motion', 'full'],
    ['themeSelection', 'playlist'],
    ['playlist', ['moonwater', 'kiln']],
    ['effects', false],
    ['music', true],
    ['haptics', false],
  ] as const)('sets %s to %j and reports it', (key, value) => {
    const play = started();
    const events = play.ok({ type: 'SetSetting', key, value } as Command);
    expect(play.game.settings[key]).toEqual(value);
    expect(events).toEqual([{ type: 'SettingChanged', profileId: play.game.profileId, key, value }]);
    // Everything else is untouched.
    const { [key]: _changed, ...rest } = play.game.settings;
    const { [key]: _default, ...defaults } = KID_DEFAULTS;
    expect(rest).toEqual(defaults);
  });

  it('setting a value the profile already has changes nothing and emits nothing', () => {
    const play = started();
    const before = play.state;
    expect(play.do({ type: 'SetSetting', key: 'effects', value: true })).toEqual([]);
    expect(play.do({ type: 'SetSetting', key: 'playlist', value: [] })).toEqual([]);
    expect(play.state).toBe(before);
  });

  it.each([
    [{ key: 'motion', value: 'fast' }],
    [{ key: 'themeSelection', value: 'shuffle' }],
    [{ key: 'playlist', value: ['kiln', 'kiln'] }],
    [{ key: 'playlist', value: ['kiln', ''] }],
    [{ key: 'playlist', value: 'kiln' }],
    [{ key: 'playlist', value: Array.from({ length: 33 }, (_, i) => `t${i}`) }],
    [{ key: 'effects', value: 'off' }],
    [{ key: 'mode', value: 'normal' }],
    [{ key: 'volume', value: 3 }],
  ])('rejects %j, leaving the state unchanged', (change) => {
    const play = started();
    const before = play.state;
    const events = play.do({ type: 'SetSetting', ...change } as unknown as Command);
    expect(events).toEqual([expect.objectContaining({ type: 'CommandRejected', command: 'SetSetting', code: 'invalid-command' })]);
    expect(play.state).toBe(before);
  });

  it('is rejected with no profile, and is not gated by a pause', () => {
    const none = new Play();
    expect(none.do({ type: 'SetSetting', key: 'motion', value: 'full' })).toEqual([expect.objectContaining({ type: 'CommandRejected' })]);
    const play = started();
    play.ok({ type: 'Pause', reason: 'panel' });
    play.ok({ type: 'SetSetting', key: 'motion', value: 'minimal' });
    expect(play.game.settings.motion).toBe('minimal');
  });
});

describe('effective motion', () => {
  it('is the setting, or Minimal while OS Reduce Motion is on', () => {
    expect(effectiveMotion('full', false)).toBe('full');
    expect(effectiveMotion('calm', false)).toBe('calm');
    expect(effectiveMotion('minimal', false)).toBe('minimal');
    expect(effectiveMotion('full', true)).toBe('minimal');
    expect(effectiveMotion('calm', true)).toBe('minimal');
  });

  it('SetOsPreferences works before any profile, emits nothing, and is exposed on the view', () => {
    const play = new Play();
    expect(play.do({ type: 'SetOsPreferences', reduceMotion: true })).toEqual([]);
    expect(play.state.os).toEqual({ reduceMotion: true });
    play.ok({ type: 'StartSession' });
    expect(selectView(play.state, tuning, THEMES)?.motion).toBe('minimal');
    play.ok({ type: 'SetOsPreferences', reduceMotion: false });
    expect(selectView(play.state, tuning, THEMES)?.motion).toBe('calm');
    play.ok({ type: 'SetSetting', key: 'motion', value: 'full' });
    expect(selectView(play.state, tuning, THEMES)?.motion).toBe('full');
    expect(play.do({ type: 'SetOsPreferences', reduceMotion: 'yes' } as unknown as Command)).toEqual([
      expect.objectContaining({ type: 'CommandRejected', command: 'SetOsPreferences' }),
    ]);
  });

  it('at Calm and Full the beats keep their tuned durations and the default transition', () => {
    const play = started();
    play.ok({ type: 'SetSetting', key: 'motion', value: 'full' });
    expect(play.tapAnswer()).toMatchObject({ kind: 'solve', durationMs: 380, transitionId: 'default' });
    expect(play.finishBeat()).toMatchObject({ kind: 'advance', durationMs: 400, transitionId: 'default' });
  });

  it('at Minimal, zooms (advance, collapse) and the round change are 400 ms crossfades; the solve beat is unchanged', () => {
    const play = started();
    play.ok({ type: 'SetOsPreferences', reduceMotion: true });
    expect(play.tapAnswer()).toMatchObject({ kind: 'solve', durationMs: 380, transitionId: 'default' });
    const crossfade = { durationMs: MINIMAL_CROSSFADE_MS, transitionId: 'crossfade' };
    expect(play.finishBeat()).toMatchObject({ kind: 'advance', ...crossfade });
    play.finishBeat();
    expect(play.solve()).toEqual([expect.objectContaining({ kind: 'advance', ...crossfade })]);
    // The third leaf completes the group: the (first, normally long) collapse is a crossfade too.
    expect(play.solve()).toEqual([expect.objectContaining({ kind: 'collapse', ...crossfade })]);
    // The top completes the round: the round change is a crossfade of at least 400 ms.
    play.tapAnswer();
    const change = play.finishBeat();
    expect(change).toMatchObject({ kind: 'roundStart', ...crossfade });
    expect(change.durationMs).toBeGreaterThanOrEqual(400);
    expect(selectView(play.state, tuning, THEMES)?.presentation).toMatchObject({ kind: 'roundStart', transitionId: 'crossfade' });
  });

  it('the Minimal setting alone has the same effect, and a change applies from the next beat', () => {
    const play = started();
    play.tapAnswer();
    play.ok({ type: 'SetSetting', key: 'motion', value: 'minimal' });
    // The running solve beat keeps its Calm duration; the advance it ends in is Minimal.
    expect(play.round.presentation).toMatchObject({ kind: 'solve', durationMs: 475 });
    expect(play.finishBeat()).toMatchObject({ kind: 'advance', durationMs: MINIMAL_CROSSFADE_MS, transitionId: 'crossfade' });
  });
});

describe('theme selection', () => {
  it('Playlist follows the playlist order, wrapping, with no consecutive repeat', () => {
    const play = started();
    expect(play.round.themeId).toBe('kiln');
    play.ok({ type: 'SetSetting', key: 'themeSelection', value: 'playlist' });
    play.ok({ type: 'SetSetting', key: 'playlist', value: ['washi-ink', 'kiln', 'moonwater'] });
    const themes = Array.from({ length: 7 }, () => play.finishRound());
    // After Kiln comes Moonwater (the next on the list), then the list from the top.
    expect(themes).toEqual(['moonwater', 'washi-ink', 'kiln', 'moonwater', 'washi-ink', 'kiln', 'moonwater']);
    for (let k = 1; k < themes.length; k += 1) expect(themes[k]).not.toBe(themes[k - 1]);
  });

  it('Playlist skips ids the catalogue lacks, starts from the top when the last theme is not on it, and falls back to Randomize when empty', () => {
    const play = started();
    play.ok({ type: 'SetSetting', key: 'themeSelection', value: 'playlist' });
    play.ok({ type: 'SetSetting', key: 'playlist', value: ['vector-noir', 'washi-ink', 'moonwater'] });
    expect([play.finishRound(), play.finishRound(), play.finishRound()]).toEqual(['washi-ink', 'moonwater', 'washi-ink']);
    play.ok({ type: 'SetSetting', key: 'playlist', value: ['nowhere'] });
    const randomized = [play.finishRound(), play.finishRound(), play.finishRound()];
    let previous = 'washi-ink';
    for (const id of randomized) {
      expect(id).not.toBe(previous);
      previous = id;
    }
  });

  it('back on Randomize, consecutive rounds still never repeat', () => {
    const play = started();
    const themes = [play.round.themeId, ...Array.from({ length: 8 }, () => play.finishRound())];
    for (let k = 1; k < themes.length; k += 1) expect(themes[k]).not.toBe(themes[k - 1]);
  });
});

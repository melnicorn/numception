import { describe, expect, it } from 'vitest';
import { parseSave } from '../save/parse-save';
import { serializeGame } from '../save/serialize-game';
import { parseTuning } from '../tuning/parse-tuning';
import { selectView } from '../view/select-view';
import type { AppState } from './app-state';
import type { Command } from './command';
import type { CommandContext } from './command-context';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { initialAppState } from './initial-app-state';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { step } from './step';

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

function ctx(i: number): CommandContext {
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`id${i}a`, `id${i}b`], seed32: [777 + i, i] } };
}

class Play {
  state: AppState = initialAppState();
  private i = 0;
  do(command: Command): readonly GameEvent[] {
    const r = step(this.state, { command, ctx: ctx(this.i++) }, tuning);
    this.state = r.state;
    return r.events;
  }
  get game(): GameState {
    return this.state.profiles[this.state.activeProfileId ?? ''] as GameState;
  }
  get round(): Round {
    return this.game.rounds.byId[this.game.rounds.activeRoundId ?? ''] as Round;
  }
  tapAnswer(): readonly GameEvent[] {
    const node = this.round.viewPath[this.round.viewPath.length - 1];
    const puzzle = node === undefined ? undefined : roundPuzzle(this.round, node);
    if (node === undefined || puzzle === undefined) throw new Error('no puzzle');
    return this.do({ type: 'TapCell', nodeId: node, cellIndex: puzzle.answerIndex });
  }
  settle(): void {
    for (let k = 0; k < 50 && this.round.presentation.kind !== 'idle'; k += 1) this.do({ type: 'Tick', elapsedMs: 100 });
  }
}

function started(): Play {
  const play = new Play();
  play.do({ type: 'StartSession' });
  return play;
}

const types = (events: readonly GameEvent[]) => events.map((e) => e.type);

describe('step: Pause and Resume (AD-17)', () => {
  it('a veiled board shows no values: every numeral is blank while blurred, and returns once the veil lifts', () => {
    const play = started();
    const before = selectView(play.state, tuning);
    expect(before?.cells.some((c) => c.text !== '')).toBe(true);
    play.do({ type: 'Pause', reason: 'lifecycle' });
    play.do({ type: 'Resume', reason: 'lifecycle' });
    const veiled = selectView(play.state, tuning);
    expect(veiled?.blurred).toBe(true);
    expect(veiled?.cells.every((c) => c.text === '')).toBe(true);
    expect(veiled?.context?.parent.cells.every((c) => c.text === '') ?? true).toBe(true);
    // Geometry is kept, so the first tap still hit-tests.
    expect(veiled?.cells.map((c) => c.polygon)).toEqual(before?.cells.map((c) => c.polygon));
    play.do({ type: 'TapCell', nodeId: veiled!.nodeId, cellIndex: 0 });
    expect(selectView(play.state, tuning)?.cells.map((c) => c.text)).toEqual(before?.cells.map((c) => c.text));
  });

  it('Pause lifecycle adds lifecycle and blur, sorted; Resume lifecycle leaves blur; duplicates change nothing', () => {
    const play = started();
    expect(play.do({ type: 'Pause', reason: 'lifecycle' })).toEqual([{ type: 'Paused', reason: 'lifecycle', pauseReasons: ['blur', 'lifecycle'] }]);
    expect(play.state.pauseReasons).toEqual(['blur', 'lifecycle']);
    const before = play.state;
    expect(play.do({ type: 'Pause', reason: 'lifecycle' })).toEqual([]);
    expect(play.state).toBe(before);
    play.do({ type: 'Pause', reason: 'panel' });
    expect(play.state.pauseReasons).toEqual(['blur', 'lifecycle', 'panel']);
    expect(play.do({ type: 'Resume', reason: 'lifecycle' })).toEqual([{ type: 'Resumed', reason: 'lifecycle', pauseReasons: ['blur', 'panel'] }]);
    expect(play.do({ type: 'Resume', reason: 'gate' })).toEqual([]);
    expect(types(play.do({ type: 'Pause', reason: 'nap' as never }))).toEqual(['CommandRejected']);
  });

  it('ignores Tick while paused: no play time passes and no beat advances', () => {
    const play = started();
    play.tapAnswer();
    play.do({ type: 'Pause', reason: 'panel' });
    const paused = play.state;
    expect(play.do({ type: 'Tick', elapsedMs: 10_000 })).toEqual([]);
    expect(play.state).toBe(paused);
  });

  it('Pause completes a running beat to its end state at the current play time', () => {
    const play = started();
    play.do({ type: 'Tick', elapsedMs: 300 });
    play.tapAnswer();
    play.do({ type: 'Tick', elapsedMs: 100 });
    expect(play.round.presentation.kind).toBe('solve');
    const clock = play.game.clockMs;
    const events = play.do({ type: 'Pause', reason: 'lifecycle' });
    expect(types(events)).toEqual(['Paused']);
    expect(play.round.presentation.kind).toBe('idle');
    expect(play.round.solved).toEqual(['1.0']);
    expect(play.round.viewPath.at(-1)).toEqual({ tier: 1, index: 1 });
    expect(play.game.clockMs).toBe(clock);
    expect(play.round.shownAtMs).toBe(clock);
  });

  it('drops input while a non-blur reason is present', () => {
    const play = started();
    play.do({ type: 'Pause', reason: 'lifecycle' });
    const before = play.state;
    expect(play.tapAnswer()).toEqual([{ type: 'InputDropped', command: 'TapCell', presentation: 'idle', pauseReasons: ['blur', 'lifecycle'] }]);
    expect(types(play.do({ type: 'ZoomOut' }))).toEqual(['InputDropped']);
    expect(play.state).toBe(before);
  });

  it('the first tap after a lifecycle pause only clears blur: no verdict, no solve, no time; the next one plays', () => {
    const play = started();
    play.do({ type: 'Tick', elapsedMs: 250 });
    play.do({ type: 'Pause', reason: 'lifecycle' });
    play.do({ type: 'Resume', reason: 'lifecycle' });
    expect(selectView(play.state, tuning)?.blurred).toBe(true);
    const round = play.round;
    expect(play.tapAnswer()).toEqual([{ type: 'BlurCleared' }]);
    expect(play.state.pauseReasons).toEqual([]);
    expect(play.round).toBe(round);
    expect(selectView(play.state, tuning)?.blurred).toBe(false);
    expect(play.tapAnswer()).toEqual([expect.objectContaining({ type: 'PuzzleSolved', responseMs: 250 })]);
  });

  it('EnterPuzzle and ZoomOut also only clear blur', () => {
    const play = started();
    play.do({ type: 'Pause', reason: 'blur' });
    const round = play.round;
    expect(play.do({ type: 'ZoomOut' })).toEqual([{ type: 'BlurCleared' }]);
    expect(play.round).toBe(round);
  });
});

describe('step: StartSession with a restored game (FR-10)', () => {
  it('continues the saved round, puzzle, solved cells and view; creates no profile or round', () => {
    const play = started();
    play.tapAnswer();
    play.settle();
    play.tapAnswer();
    play.settle();
    const saved = parseSave(JSON.stringify(serializeGame(play.game, 1)));
    if (!saved.ok) throw new Error(saved.error.message);

    const relaunch = new Play();
    const events = relaunch.do({ type: 'StartSession', restore: saved.value.game });
    expect(events).toEqual([]);
    expect(relaunch.game).toEqual(play.game);
    expect(relaunch.state.activeProfileId).toBe(play.game.profileId);
    expect(selectView(relaunch.state, tuning)).toEqual(selectView(play.state, tuning));
    expect(selectView(relaunch.state, tuning)?.kind).toBe('puzzle');
  });

  it('completes a beat the game was saved in, so the first frame is the idle puzzle', () => {
    const play = started();
    play.tapAnswer();
    play.do({ type: 'Tick', elapsedMs: 50 });
    const relaunch = new Play();
    relaunch.do({ type: 'StartSession', restore: play.game });
    expect(relaunch.round.presentation.kind).toBe('idle');
    expect(relaunch.round.solved).toEqual(['1.0']);
    expect(selectView(relaunch.state, tuning)).toMatchObject({ kind: 'puzzle', inputLocked: false, nodeId: { tier: 1, index: 1 } });
  });

  it('starts a round for a restored game with none active, and rejects a restore that is not a game', () => {
    const play = started();
    const game = { ...play.game, rounds: { activeRoundId: null, byId: {} } };
    const relaunch = new Play();
    expect(types(relaunch.do({ type: 'StartSession', restore: game }))).toEqual(['RoundStarted']);
    expect(relaunch.game.profileId).toBe(game.profileId);
    const fresh = new Play();
    expect(types(fresh.do({ type: 'StartSession', restore: { profileId: 1 } as never }))).toEqual(['CommandRejected']);
    expect(fresh.state).toEqual(initialAppState());
  });
});

import { type CommandContext, parseTuning, puzzleInView, type TuningConfig } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { createGame, type Game } from './game';
import { createScheduler, type FrameLoop } from './scheduler';

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

function fixedEntropy() {
  let i = 0;
  return (): CommandContext['entropy'] => {
    i += 1;
    return { ids: [`id-${i}-a`, `id-${i}-b`], seed32: [(i * 2654435761) >>> 0, i] };
  };
}

/** A manual clock and frame loop: `frame(ms)` advances the clock and runs the pending frame. */
function harness(config: TuningConfig = tuning) {
  let clock = 1000;
  let pending: (() => void) | null = null;
  let nextHandle = 1;
  const frames: FrameLoop = {
    request(callback) {
      pending = callback;
      return nextHandle++;
    },
    cancel() {
      pending = null;
    },
  };
  const game = createGame({ tuning: config, entropy: fixedEntropy(), now: () => 0 });
  const dispatched: number[] = [];
  const realDispatch = game.dispatch;
  const spied: Game = {
    ...game,
    dispatch(command) {
      if (command.type === 'Tick') dispatched.push(command.elapsedMs);
      return realDispatch(command);
    },
  };
  const scheduler = createScheduler({ game: spied, now: () => clock, frames });
  return {
    game: spied,
    scheduler,
    ticks: dispatched,
    advance(ms: number) {
      clock += ms;
    },
    frame(ms: number) {
      clock += ms;
      const run = pending;
      pending = null;
      run?.();
    },
    hasFrame: () => pending !== null,
  };
}

function tapAnswerOf(h: ReturnType<typeof harness>) {
  const view = h.game.getView();
  if (view === null) throw new Error('no view');
  // A + puzzle: the answer is the cell equal to half the total.
  const values = view.cells.map((c) => Number(c.text));
  const total = values.reduce((a, b) => a + b, 0);
  const cell = view.cells.find((c) => Number(c.text) * 2 === total);
  if (cell === undefined) throw new Error('no answer');
  return { type: 'TapCell' as const, nodeId: view.nodeId, cellIndex: cell.index };
}

describe('createScheduler', () => {
  it('requests no frames while idle, and flushes idle play time as one Tick before a command', () => {
    const h = harness();
    h.scheduler.dispatch({ type: 'StartSession' });
    expect(h.hasFrame()).toBe(false);
    expect(h.scheduler.running()).toBe(false);
    h.advance(1234.6);
    const events = h.scheduler.dispatch(tapAnswerOf(h));
    expect(h.ticks).toEqual([1234]);
    expect(events).toEqual([expect.objectContaining({ type: 'PuzzleSolved', responseMs: 1234 })]);
  });

  it('runs frames while a beat runs, dispatching whole-ms Ticks with the fraction carried, and stops at idle', () => {
    const h = harness();
    h.scheduler.dispatch({ type: 'StartSession' });
    h.scheduler.dispatch(tapAnswerOf(h));
    expect(h.scheduler.running()).toBe(true);
    h.frame(16.5);
    h.frame(16.5);
    expect(h.ticks).toEqual([16, 17]);
    // Calm: solve 475 ms + advance 500 ms.
    for (let k = 0; k < 100 && h.hasFrame(); k += 1) h.frame(16);
    expect(h.hasFrame()).toBe(false);
    expect(h.game.getView()?.inputLocked).toBe(false);
    expect(h.game.getView()?.nodeId).toEqual({ tier: 1, index: 1 });
  });

  it('dispatches no Ticks while paused, excludes the paused time, and resumes only when every reason is cleared', () => {
    const h = harness();
    h.scheduler.dispatch({ type: 'StartSession' });
    h.scheduler.dispatch(tapAnswerOf(h));
    h.frame(100);
    expect(h.ticks).toEqual([100]);
    h.advance(50);
    h.scheduler.pause('panel');
    // The live 50 ms is ticked first; the pause then completes the running beat.
    expect(h.ticks).toEqual([100, 50]);
    expect(h.game.getView()?.inputLocked).toBe(false);
    h.scheduler.pause('gate');
    expect([...h.scheduler.pauseReasons()]).toEqual(['gate', 'panel']);
    expect(h.hasFrame()).toBe(false);
    h.advance(60_000);
    h.scheduler.resume('panel');
    h.advance(60_000);
    h.scheduler.resume('gate');
    expect(h.scheduler.pauseReasons().size).toBe(0);
    h.advance(20);
    const events = h.scheduler.dispatch(tapAnswerOf(h));
    // Only live time was ticked: none of the two paused minutes.
    expect(h.ticks).toEqual([100, 50, 20]);
    expect(events).toEqual([expect.objectContaining({ type: 'PuzzleSolved', responseMs: 20 })]);
    expect(h.hasFrame()).toBe(true);
  });

  it('a lifecycle pause leaves blur after Resume: no Ticks until the first tap clears it, and that tap only unblurs', () => {
    const h = harness();
    h.scheduler.dispatch({ type: 'StartSession' });
    h.advance(300);
    h.scheduler.pause('lifecycle');
    expect(h.ticks).toEqual([300]);
    h.advance(10_000);
    h.scheduler.resume('lifecycle');
    expect([...h.scheduler.pauseReasons()]).toEqual(['blur']);
    expect(h.game.getView()?.blurred).toBe(true);
    h.advance(5_000);
    expect(h.scheduler.dispatch(tapAnswerOf(h))).toEqual([{ type: 'BlurCleared' }]);
    expect(h.ticks).toEqual([300]);
    expect(h.game.getView()?.blurred).toBe(false);
    h.advance(40);
    expect(h.scheduler.dispatch(tapAnswerOf(h))).toEqual([expect.objectContaining({ type: 'PuzzleSolved', responseMs: 340 })]);
    expect(h.ticks).toEqual([300, 40]);
  });

  it('a pause mid-beat stops the frames and completes the beat', () => {
    const h = harness();
    h.scheduler.dispatch({ type: 'StartSession' });
    h.scheduler.dispatch(tapAnswerOf(h));
    expect(h.scheduler.running()).toBe(true);
    h.scheduler.pause('lifecycle');
    expect(h.scheduler.running()).toBe(false);
    expect(h.hasFrame()).toBe(false);
    expect(h.game.getView()).toMatchObject({ inputLocked: false, nodeId: { tier: 1, index: 1 }, blurred: true });
  });

  it('stops after destroy', () => {
    const h = harness();
    h.scheduler.dispatch({ type: 'StartSession' });
    h.scheduler.dispatch(tapAnswerOf(h));
    h.scheduler.destroy();
    expect(h.hasFrame()).toBe(false);
    h.advance(100);
    h.game.dispatch({ type: 'Tick', elapsedMs: 1 });
    expect(h.hasFrame()).toBe(false);
  });

  it('runs frames while a soft-miss cue runs (it locks nothing), and stops when it ends', () => {
    const sub = { ...tuning, generation: { ...tuning.generation, operators: ['add', 'sub'] as typeof tuning.generation.operators } };
    const h = harness(sub);
    h.scheduler.dispatch({ type: 'StartSession' });
    const puzzle = () => {
      const p = puzzleInView(h.game.getState());
      if (p === undefined) throw new Error('no puzzle');
      return p;
    };
    // Rounds 0 (Classic +) and 1 (Tower +), then round 2 is Classic −.
    for (let k = 0; k < 17; k += 1) {
      h.scheduler.dispatch({ type: 'TapCell', nodeId: puzzle().nodeId, cellIndex: puzzle().answerIndex });
      while (h.hasFrame()) h.frame(100);
    }
    expect(puzzle().spec.operator).toBe('sub');
    const events = h.scheduler.dispatch({ type: 'TapCell', nodeId: puzzle().nodeId, cellIndex: puzzle().roles.b });
    expect(events.map((e) => e.type)).toEqual(['SoftMiss']);
    expect(h.game.getView()).toMatchObject({ inputLocked: false, softMiss: { progress: 0 } });
    expect(h.scheduler.running()).toBe(true);
    h.frame(375);
    expect(h.game.getView()?.softMiss?.progress).toBe(0.5);
    h.frame(375);
    expect(h.game.getView()?.softMiss).toBeUndefined();
    expect(h.scheduler.running()).toBe(false);
  });
});

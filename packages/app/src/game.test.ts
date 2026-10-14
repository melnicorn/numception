import { type CommandContext, parseTuning } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { createGame } from './game';

const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add', 'sub'],
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

describe('createGame', () => {
  it('has no view until StartSession, then shows the first leaf', () => {
    const game = createGame({ tuning, entropy: fixedEntropy(), now: () => 0 });
    expect(game.getView()).toBeNull();
    game.dispatch({ type: 'StartSession' });
    expect(game.getView()?.nodeId).toEqual({ tier: 1, index: 0 });
    expect(game.getView()?.shapeId).toBe('3A');
  });

  it('dispatches synchronously: listeners see the new view and events before dispatch returns', () => {
    const game = createGame({ tuning, entropy: fixedEntropy(), now: () => Date.UTC(2026, 9, 14, 12) });
    const seen: unknown[] = [];
    const unsubscribe = game.subscribe((view, events) => seen.push({ node: view?.nodeId, types: events.map((e) => e.type) }));
    const events = game.dispatch({ type: 'StartSession' });
    expect(seen).toEqual([{ node: { tier: 1, index: 0 }, types: ['ProfileCreated', 'RoundStarted'] }]);
    expect(events.map((e) => e.type)).toEqual(['ProfileCreated', 'RoundStarted']);

    // Tap each cell's label point until one solves the puzzle; the view moves on.
    const view = game.getView();
    if (view === null) throw new Error('no view');
    let solved = false;
    for (const cell of view.cells) {
      const ref = game.hitTest(cell.labelPoint, 0.01);
      expect(ref).toEqual({ nodeId: view.nodeId, cellIndex: cell.index });
      if (ref === null) continue;
      const tapEvents = game.dispatch({ type: 'TapCell', ...ref });
      if (tapEvents.some((e) => e.type === 'PuzzleSolved')) {
        solved = true;
        break;
      }
      expect(tapEvents.map((e) => e.type)).toEqual(['WrongTap']);
      expect(game.getView()).toEqual(view);
    }
    expect(solved).toBe(true);
    // The solve beat runs first: input is locked on the solved puzzle until Ticks end it.
    expect(game.getView()?.nodeId).toEqual({ tier: 1, index: 0 });
    expect(game.getView()?.inputLocked).toBe(true);
    expect(seen.at(-1)).toEqual({ node: { tier: 1, index: 0 }, types: ['PuzzleSolved'] });
    game.dispatch({ type: 'Tick', elapsedMs: 10_000 });
    expect(game.getView()?.nodeId).toEqual({ tier: 1, index: 1 });
    expect(game.getView()?.inputLocked).toBe(false);

    unsubscribe();
    const count = seen.length;
    game.dispatch({ type: 'StartSession' });
    expect(seen).toHaveLength(count);
  });

  it('hit-tests to null on the operator', () => {
    const game = createGame({ tuning, entropy: fixedEntropy(), now: () => 0 });
    expect(game.hitTest([0.5, 0.5], 0.01)).toBeNull();
    game.dispatch({ type: 'StartSession' });
    const view = game.getView();
    expect(view && game.hitTest(view.operator.labelPoint, 0.01)).toBeNull();
  });

  it('is deterministic given the same entropy, clock and commands', () => {
    const play = () => {
      const game = createGame({ tuning, entropy: fixedEntropy(), now: () => 1000 });
      game.dispatch({ type: 'StartSession' });
      return game.getView();
    };
    expect(play()).toEqual(play());
  });
});

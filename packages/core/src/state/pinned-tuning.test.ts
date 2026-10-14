import { describe, expect, it } from 'vitest';
import { parseSave } from '../save/parse-save';
import { serializeGame } from '../save/serialize-game';
import { parseTuning } from '../tuning/parse-tuning';
import type { TuningConfig } from '../tuning/tuning-config';
import type { TuningsByVersion } from '../tuning/tunings-by-version';
import type { AppState } from './app-state';
import type { Command } from './command';
import type { CommandContext } from './command-context';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { initialAppState } from './initial-app-state';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { step } from './step';

function tuningV(version: number, roundTransitionMs: number): TuningConfig {
  const parsed = parseTuning({
    kind: 'TuningConfig',
    schemaVersion: 1,
    tuningVersion: version,
    generation: {
      operators: ['add', 'sub'],
      n: { min: 3, max: 3 },
      bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
      distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
      retries: { maxAttempts: 100 },
    },
    presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 1200, collapseMs: 800, roundTransitionMs, calmMotionScale: 1.25, softMissMs: 600 },
  });
  if (!parsed.ok) throw new Error(parsed.error.message);
  return parsed.value;
}

const V1 = tuningV(1, 400);
const V2 = tuningV(2, 900);
const ALL: TuningsByVersion = { 1: V1, 2: V2 };

function ctx(i: number): CommandContext {
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`a${i}`, `b${i}`], seed32: [777, i] } };
}

function activeRound(state: AppState): Round {
  const game = state.profiles[state.activeProfileId ?? ''];
  const round = game?.rounds.byId[game.rounds.activeRoundId ?? ''];
  if (round === undefined) throw new Error('no round');
  return round;
}

/** Taps the answer in view and ticks the beats out under `tuning` / `tunings`; returns the state and events. */
function solveOne(state: AppState, k: number, tuning: TuningConfig, tunings: TuningsByVersion): { state: AppState; events: GameEvent[] } {
  const round = activeRound(state);
  const node = round.viewPath[round.viewPath.length - 1];
  const puzzle = node === undefined ? undefined : roundPuzzle(round, node);
  if (node === undefined || puzzle === undefined) throw new Error('no puzzle in view');
  const events: GameEvent[] = [];
  let s = state;
  for (const command of [{ type: 'TapCell', nodeId: node, cellIndex: puzzle.answerIndex }, { type: 'Tick', elapsedMs: 5000 }] as Command[]) {
    const r = step(s, { command, ctx: ctx(k) }, tuning, undefined, tunings);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

describe('a round stays pinned to its tuning (AD-7)', () => {
  it('a round saved under tuning 1 resumes and finishes under a build whose latest is tuning 2; the next round is on 2', () => {
    // Played under the v1 build: start and solve the first leaf, then save.
    let state = step(initialAppState(), { command: { type: 'StartSession' }, ctx: ctx(0) }, V1).state;
    state = solveOne(state, 1, V1, { 1: V1 }).state;
    expect(activeRound(state).tuningVersion).toBe(1);
    const saved = parseSave(JSON.stringify(serializeGame(state.profiles[state.activeProfileId ?? ''] as GameState, 1)));
    if (!saved.ok) throw new Error(saved.error.message);

    // The v2 build resumes it: every remaining leaf realises under v1, and the round completes.
    let resumed = step(initialAppState(), { command: { type: 'StartSession', restore: saved.value.game }, ctx: ctx(10) }, V2, undefined, ALL).state;
    const roundId = activeRound(resumed).roundId;
    const events: GameEvent[] = [];
    for (let k = 11; activeRound(resumed).roundId === roundId; k += 1) {
      if (k > 30) throw new Error('the pinned round never finished');
      const solved = solveOne(resumed, k, V2, ALL);
      resumed = solved.state;
      events.push(...solved.events);
    }
    expect(events.filter((e) => e.type === 'CommandRejected')).toEqual([]);
    expect(events.map((e) => e.type)).toContain('RoundCompleted');
    expect(activeRound(resumed).tuningVersion).toBe(2);
  });

  it('without the pinned tuning bundled, the old round cannot realise its next leaf (what pinning prevents)', () => {
    let state = step(initialAppState(), { command: { type: 'StartSession' }, ctx: ctx(0) }, V1).state;
    state = solveOne(state, 1, V1, {}).state;
    const { events } = solveOne(state, 2, V2, {});
    expect(events.some((e) => e.type === 'CommandRejected')).toBe(true);
  });
});

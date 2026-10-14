import { describe, expect, it } from 'vitest';
import { parseTuning } from '../tuning/parse-tuning';
import type { AppState } from '../state/app-state';
import type { CommandContext } from '../state/command-context';
import type { GameState } from '../state/game-state';
import { initialAppState } from '../state/initial-app-state';
import { step } from '../state/step';
import { saveChecksum } from './save-checksum';
import { parseSave } from './parse-save';
import { SAVE_FORMAT_VERSION } from './save-format-version';
import { serializeGame } from './serialize-game';
import { MIGRATIONS, type SaveMigration } from './migrations';
import type { Round } from '../state/round';
import { parseDeviceSettings } from './parse-device-settings';
import { serializeDeviceSettings } from './serialize-device-settings';

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
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`a${i}`, `b${i}`], seed32: [4242 + i, i] } };
}

/** A game mid-round: started, one leaf solved (its beats ticked out), mid-way through the next solve beat. */
function midRound(): GameState {
  let state: AppState = initialAppState();
  let i = 0;
  const run = (command: Parameters<typeof step>[1]['command']) => {
    state = step(state, { command, ctx: ctx(i++) }, tuning).state;
  };
  const tapAnswer = () => {
    const g = state.profiles[state.activeProfileId ?? ''] as GameState;
    const r = g.rounds.byId[g.rounds.activeRoundId ?? ''];
    const node = r?.viewPath[r.viewPath.length - 1];
    const puzzle = node === undefined ? undefined : r?.puzzles[`${node.tier}.${node.index}`];
    if (puzzle === undefined || node === undefined) throw new Error('no puzzle');
    run({ type: 'TapCell', nodeId: node, cellIndex: puzzle.answerIndex });
  };
  run({ type: 'StartSession' });
  run({ type: 'Tick', elapsedMs: 900 });
  tapAnswer();
  run({ type: 'Tick', elapsedMs: 5000 });
  tapAnswer();
  run({ type: 'Tick', elapsedMs: 100 });
  return state.profiles[state.activeProfileId ?? ''] as GameState;
}

describe('serializeGame / parseSave', () => {
  it('round-trips a game mid-round through JSON', () => {
    const game = midRound();
    const doc = serializeGame(game, 7);
    expect(doc).toMatchObject({ kind: 'GameSave', schemaVersion: 1, saveFormatVersion: SAVE_FORMAT_VERSION, generation: 7 });
    expect(SAVE_FORMAT_VERSION).toBe(2);
    expect(doc.checksum).toBe(saveChecksum({ game }));
    const back = parseSave(JSON.stringify(doc));
    expect(back).toEqual({ ok: true, value: { game, generation: 7, saveFormatVersion: SAVE_FORMAT_VERSION } });
  });

  it('rejects a payload that no longer matches its checksum', () => {
    const doc = serializeGame(midRound(), 1);
    const json = JSON.stringify(doc).replace('"clockMs":', '"clockMs":1');
    expect(parseSave(json)).toMatchObject({ ok: false, error: { code: 'save-checksum-mismatch' } });
  });

  it('rejects truncated JSON, a wrong kind, and a game that fails its structural check', () => {
    const json = JSON.stringify(serializeGame(midRound(), 1));
    expect(parseSave(json.slice(0, json.length / 2))).toMatchObject({ ok: false, error: { code: 'invalid-save' } });
    expect(parseSave(JSON.stringify({ ...JSON.parse(json), kind: 'Other' }))).toMatchObject({ ok: false, error: { code: 'invalid-save' } });
    const payload = { game: { profileId: 'p' } };
    const bad = { kind: 'GameSave', schemaVersion: 1, saveFormatVersion: 1, generation: 1, checksum: saveChecksum(payload), payload };
    expect(parseSave(JSON.stringify(bad))).toMatchObject({ ok: false, error: { code: 'invalid-save' } });
    expect(parseSave('null')).toMatchObject({ ok: false, error: { code: 'invalid-save' } });
  });

  it('rejects a newer saveFormatVersion or schemaVersion as save-too-new, before its checksum is even read', () => {
    const doc = serializeGame(midRound(), 1);
    const newer = { ...doc, saveFormatVersion: SAVE_FORMAT_VERSION + 1, checksum: 0, payload: { anything: true } };
    expect(parseSave(JSON.stringify(newer))).toMatchObject({ ok: false, error: { code: 'save-too-new' } });
    expect(parseSave(JSON.stringify({ ...doc, schemaVersion: 2 }))).toMatchObject({ ok: false, error: { code: 'save-too-new' } });
  });

  it('migrates a v0 save (the bare GameState) forward to the current format', () => {
    const game = midRound();
    const v0 = { kind: 'GameSave', schemaVersion: 1, saveFormatVersion: 0, generation: 3, checksum: saveChecksum(game), payload: game };
    expect(parseSave(JSON.stringify(v0))).toEqual({ ok: true, value: { game, generation: 3, saveFormatVersion: 0 } });
  });

  it('migrates a v1 save (no soft-miss fields) to v2: softMissLineSeen false, no cue, no guide line', () => {
    const game = midRound();
    const strip = ({ softMiss: _s, guideLine: _g, ...round }: Round) => round;
    const { softMissLineSeen: _seen, ...v1Game } = game;
    const v1Payload = {
      game: { ...v1Game, rounds: { ...game.rounds, byId: Object.fromEntries(Object.entries(game.rounds.byId).map(([id, r]) => [id, strip(r)])) } },
    };
    const v1 = { kind: 'GameSave', schemaVersion: 1, saveFormatVersion: 1, generation: 4, checksum: saveChecksum(v1Payload), payload: v1Payload };
    // Without the migration the v1 game is not loadable at v2.
    expect(parseSave(JSON.stringify(v1), { version: 2, migrations: { 0: MIGRATIONS[0] as SaveMigration } })).toMatchObject({ ok: false });
    const back = parseSave(JSON.stringify(v1));
    expect(back).toEqual({ ok: true, value: { game, generation: 4, saveFormatVersion: 1 } });
    if (back.ok) expect(back.value.game.softMissLineSeen).toBe(false);
  });

  it('keeps softMissLineSeen across save and load, so a reloaded profile sees no second guide line', () => {
    const game: GameState = { ...midRound(), softMissLineSeen: true };
    const back = parseSave(JSON.stringify(serializeGame(game, 2)));
    expect(back.ok && back.value.game.softMissLineSeen).toBe(true);
    const missing = { ...serializeGame(game, 2) };
    const { softMissLineSeen: _seen, ...bad } = game;
    const payload = { game: bad };
    expect(parseSave(JSON.stringify({ ...missing, checksum: saveChecksum(payload), payload }))).toMatchObject({ ok: false, error: { code: 'invalid-save' } });
  });

  it('walks a multi-step migration path one version at a time, and refuses a gap in it', () => {
    const game = midRound();
    // Synthetic format 3: v1 `{ game }` → v2 `{ profile }` → v3 `{ game: profile }`, in order.
    const steps: string[] = [];
    const migrations = {
      0: (p: unknown) => (steps.push('0→1'), { game: p }),
      1: (p: unknown) => (steps.push('1→2'), { profile: (p as { game: unknown }).game }),
      2: (p: unknown) => (steps.push('2→3'), { game: (p as { profile: unknown }).profile }),
    };
    const v0 = { kind: 'GameSave', schemaVersion: 1, saveFormatVersion: 0, generation: 1, checksum: saveChecksum(game), payload: game };
    expect(parseSave(JSON.stringify(v0), { version: 3, migrations })).toMatchObject({ ok: true, value: { game } });
    expect(steps).toEqual(['0→1', '1→2', '2→3']);
    expect(parseSave(JSON.stringify(v0), { version: 3, migrations: { 0: migrations[0], 2: migrations[2] } })).toMatchObject({
      ok: false,
      error: { code: 'invalid-save' },
    });
  });
});

describe('DeviceSettings', () => {
  it('round-trips and rejects a newer schemaVersion as save-too-new', () => {
    const doc = serializeDeviceSettings({ activeProfileId: 'p1' });
    expect(doc).toEqual({ kind: 'DeviceSettings', schemaVersion: 1, activeProfileId: 'p1' });
    expect(parseDeviceSettings(JSON.stringify(doc))).toEqual({ ok: true, value: { activeProfileId: 'p1' } });
    expect(parseDeviceSettings(JSON.stringify({ ...doc, schemaVersion: 2 }))).toMatchObject({ ok: false, error: { code: 'save-too-new' } });
    expect(parseDeviceSettings('{"kind":"DeviceSettings"')).toMatchObject({ ok: false, error: { code: 'invalid-save' } });
  });
});

import type { DomainError } from '../result/domain-error';
import type { GameState } from '../state/game-state';

const PRESENTATION_KINDS = ['idle', 'solve', 'collapse', 'advance', 'roundStart'];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isCount(x: unknown): boolean {
  return typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
}

/**
 * Why `x` is not a loadable `GameState`, or undefined when it is. A structural
 * check of the fields the play loop reads first (the profile, its settings, and
 * the active round's view and timeline); the checksum is what guards the rest of
 * the content against corruption.
 */
export function checkGameState(x: unknown): DomainError | undefined {
  const bad = (message: string): DomainError => ({ code: 'invalid-save', message: `game ${message}` });
  if (!isRecord(x)) return bad('must be an object');
  if (typeof x.profileId !== 'string' || x.profileId === '') return bad('.profileId must be a non-empty string');
  if (x.profileKind !== 'kid') return bad('.profileKind must be kid');
  if (!isCount(x.rootSeed) || (x.rootSeed as number) > 0xffffffff) return bad('.rootSeed must be a uint32');
  const settings = x.settings;
  if (!isRecord(settings) || settings.mode !== 'zen' || (settings.motion !== 'full' && settings.motion !== 'calm')) {
    return bad('.settings must hold mode zen and motion full or calm');
  }
  if (!isCount(x.roundOrdinal)) return bad('.roundOrdinal must be a non-negative integer');
  if (!isCount(x.clockMs)) return bad('.clockMs must be a non-negative integer');
  if (typeof x.firstCollapseSeen !== 'boolean') return bad('.firstCollapseSeen must be a boolean');
  if (typeof x.softMissLineSeen !== 'boolean') return bad('.softMissLineSeen must be a boolean');
  const rounds = x.rounds;
  if (!isRecord(rounds) || !isRecord(rounds.byId)) return bad('.rounds must hold byId');
  const activeId = rounds.activeRoundId;
  if (activeId === null) return undefined;
  if (typeof activeId !== 'string') return bad('.rounds.activeRoundId must be a string or null');
  const round = rounds.byId[activeId];
  if (!isRecord(round)) return bad('.rounds.byId has no active round');
  if (!Array.isArray(round.viewPath) || round.viewPath.length === 0) return bad('active round .viewPath must be non-empty');
  if (!isRecord(round.plan) || !Array.isArray(round.plan.nodes)) return bad('active round .plan must hold nodes');
  if (!isRecord(round.puzzles) || !Array.isArray(round.solved)) return bad('active round must hold puzzles and solved');
  const p = round.presentation;
  if (!isRecord(p) || !PRESENTATION_KINDS.includes(p.kind as string) || !isCount(p.startedAtMs) || !isCount(p.durationMs)) {
    return bad('active round .presentation is malformed');
  }
  const cue = round.softMiss;
  if (cue !== null && (!isRecord(cue) || !isRecord(cue.nodeId) || !isCount(cue.cellIndex) || !isCount(cue.answerIndex) || !isCount(cue.startedAtMs) || !isCount(cue.durationMs))) {
    return bad('active round .softMiss must be null or a cue');
  }
  if (typeof round.guideLine !== 'boolean') return bad('active round .guideLine must be a boolean');
  return undefined;
}

/** `x` as a `GameState` when `checkGameState` passes. */
export function isGameState(x: unknown): x is GameState {
  return checkGameState(x) === undefined;
}

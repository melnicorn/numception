import type { NodeId } from '../generator/node-id';
import type { DomainError } from '../result/domain-error';
import { childrenOf, topNodeId } from '../rounds/round-node-id';
import { realiseRoundNode } from '../rounds/round-types';
import { classifyTap } from '../rules/classify-tap';
import type { TuningConfig } from '../tuning/tuning-config';
import type { AppState } from './app-state';
import type { CommandContext } from './command-context';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { nodeKey } from './node-key';
import { reject } from './reject';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { LEAF_BAND, startRound } from './start-round';
import type { StepResult } from './step-result';
import { withGame } from './with-game';

const COMMAND = 'TapCell';

function invalid(message: string): DomainError {
  return { code: 'invalid-command', message };
}

function sameNode(a: NodeId, b: unknown): boolean {
  if (typeof b !== 'object' || b === null) return false;
  const { tier, index } = b as Record<string, unknown>;
  return a.tier === tier && a.index === index;
}

/**
 * The view after `round`'s node in view was solved (AD-25): the next unsolved leaf
 * in index order (realised now if new, AD-4), else the top puzzle. Classic only.
 */
function advance(round: Round, tuning: TuningConfig): Round | DomainError {
  const top = topNodeId(round.plan.tiers);
  const next = childrenOf(top, round.plan.n).find((leaf) => !round.solved.includes(nodeKey(leaf)));
  if (next === undefined) return { ...round, viewPath: [top] };
  const key = nodeKey(next);
  if (round.puzzles[key] !== undefined) return { ...round, viewPath: [top, next] };
  const leaf = realiseRoundNode(round.plan, next, LEAF_BAND, tuning);
  if (!leaf.ok) return leaf.error;
  return { ...round, puzzles: { ...round.puzzles, [key]: leaf.value }, viewPath: [top, next] };
}

/**
 * `TapCell { nodeId, cellIndex }` on the puzzle in view (FR-4, FR-7):
 *
 * - `correct`: marks the node solved (`PuzzleSolved`) and advances the view. Solving
 *   the top completes the round (`RoundCompleted`), increments `roundOrdinal` and
 *   starts the next Classic round (`RoundStarted`); the completed round is dropped.
 * - `wrong` / `softMiss`: emits `WrongTap` / `SoftMiss` and changes nothing else.
 *
 * A tap with no active round, on a puzzle not in view or an invalid cell is
 * rejected; so is a correct tap whose next puzzle cannot be realised, atomically.
 */
export function reduceTapCell(
  state: AppState,
  command: { readonly nodeId: NodeId; readonly cellIndex: number },
  ctx: CommandContext,
  tuning: TuningConfig,
): StepResult {
  const game: GameState | undefined = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  const roundId = game?.rounds.activeRoundId ?? null;
  const round = game === undefined || roundId === null ? undefined : game.rounds.byId[roundId];
  if (game === undefined || round === undefined) return reject(state, COMMAND, invalid('no active round'));
  const inView = round.viewPath[round.viewPath.length - 1];
  if (inView === undefined || !sameNode(inView, command.nodeId)) {
    return reject(state, COMMAND, invalid('nodeId is not the puzzle in view'));
  }
  const puzzle = roundPuzzle(round, inView);
  if (puzzle === undefined) return reject(state, COMMAND, invalid(`puzzle ${nodeKey(inView)} is not realised`));
  const outcome = classifyTap(puzzle, command.cellIndex);
  if (!outcome.ok) return reject(state, COMMAND, outcome.error);

  const tap = { roundId: round.roundId, nodeId: inView, cellIndex: command.cellIndex };
  if (outcome.value === 'wrong') return { state, events: [{ type: 'WrongTap', ...tap }] };
  if (outcome.value === 'softMiss') return { state, events: [{ type: 'SoftMiss', ...tap }] };

  const events: GameEvent[] = [{ type: 'PuzzleSolved', ...tap }];
  const solved: Round = { ...round, solved: [...round.solved, nodeKey(inView)] };
  if (inView.tier < round.plan.tiers) {
    const advanced = advance(solved, tuning);
    if ('code' in advanced) return reject(state, COMMAND, advanced);
    const byId = { ...game.rounds.byId, [round.roundId]: advanced };
    return { state: withGame(state, { ...game, rounds: { ...game.rounds, byId } }), events };
  }

  events.push({ type: 'RoundCompleted', roundId: round.roundId, roundOrdinal: game.roundOrdinal });
  const roundOrdinal = game.roundOrdinal + 1;
  const nextId = ctx.entropy.ids[0];
  const next = startRound(nextId, game.rootSeed, roundOrdinal, tuning);
  if (!next.ok) return reject(state, COMMAND, next.error);
  events.push({ type: 'RoundStarted', roundId: nextId, roundOrdinal });
  const { [round.roundId]: _completed, ...rest } = game.rounds.byId;
  const nextGame: GameState = { ...game, roundOrdinal, rounds: { activeRoundId: nextId, byId: { ...rest, [nextId]: next.value } } };
  return { state: withGame(state, nextGame), events };
}

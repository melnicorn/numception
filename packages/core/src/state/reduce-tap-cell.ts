import type { NodeId } from '../generator/node-id';
import { softMissDuration } from '../presentation/beat-duration';
import type { DomainError } from '../result/domain-error';
import { classifyTap } from '../rules/classify-tap';
import type { TuningConfig } from '../tuning/tuning-config';
import { activeRound } from './active-round';
import type { AppState } from './app-state';
import { beatAt } from './beat';
import type { CommandContext } from './command-context';
import { dropInput } from './drop-input';
import { isPlayable } from './is-playable';
import { nodeKey } from './node-key';
import { reject } from './reject';
import { roundPuzzle } from './round-puzzle';
import { sameNode } from './same-node';
import type { StepResult } from './step-result';
import { withGame } from './with-game';
import { withRound } from './with-round';

const COMMAND = 'TapCell';

function invalid(message: string): DomainError {
  return { code: 'invalid-command', message };
}

/**
 * `TapCell { nodeId, cellIndex }` on the puzzle in view (FR-4, FR-7, AD-20):
 *
 * - While a beat runs, the tap is dropped (`InputDropped`), changing nothing.
 * - `correct`: `PuzzleSolved` now, and a `solve` beat starts; its end (on `Tick`)
 *   applies the solve and moves on (`endBeat`). A tap solving the top reserves the
 *   next round's id, `ctx.entropy.ids[0]`.
 * - `wrong`: emits `WrongTap` and changes nothing else.
 * - `softMiss` (− puzzles: `b`, a valid reading `a − c = b`): never a wrong tap.
 *   `SoftMiss`; no puzzle state changes and no beat starts, so input stays open.
 *   The round's soft-miss cue (re)starts now for `softMissDuration` (the tapped
 *   cell pulses, a ghost arrow points at the answer). The profile's first one
 *   also sets `softMissLineSeen` and raises the guide line, which a correct tap
 *   takes down again.
 *
 * Every verdict carries `responseMs`: the profile's Tick time since the puzzle was
 * shown. A tap with no active round, on a node not in view, on an overview or on
 * an invalid cell is rejected.
 */
export function reduceTapCell(
  state: AppState,
  command: { readonly nodeId: NodeId; readonly cellIndex: number },
  ctx: CommandContext,
  tuning: TuningConfig,
): StepResult {
  const active = activeRound(state);
  if (active === undefined) return reject(state, COMMAND, invalid('no active round'));
  const { game, round } = active;
  if (round.presentation.kind !== 'idle') return dropInput(state, COMMAND, round.presentation.kind);
  const inView = round.viewPath[round.viewPath.length - 1];
  if (inView === undefined || !sameNode(inView, command.nodeId)) {
    return reject(state, COMMAND, invalid('nodeId is not the puzzle in view'));
  }
  if (!isPlayable(round, inView)) return reject(state, COMMAND, invalid(`${nodeKey(inView)} is an overview; enter one of its cells`));
  const puzzle = roundPuzzle(round, inView);
  if (puzzle === undefined) return reject(state, COMMAND, invalid(`puzzle ${nodeKey(inView)} is not realised`));
  const outcome = classifyTap(puzzle, command.cellIndex);
  if (!outcome.ok) return reject(state, COMMAND, outcome.error);

  const responseMs = game.clockMs - (round.shownAtMs ?? game.clockMs);
  const tap = { roundId: round.roundId, nodeId: inView, cellIndex: command.cellIndex, responseMs };
  if (outcome.value === 'wrong') return { state, events: [{ type: 'WrongTap', ...tap }] };
  if (outcome.value === 'softMiss') {
    const cue = {
      nodeId: inView,
      cellIndex: command.cellIndex,
      answerIndex: puzzle.answerIndex,
      startedAtMs: game.clockMs,
      durationMs: softMissDuration(tuning, game.settings.motion),
    };
    const first = !game.softMissLineSeen;
    const cued = { ...round, softMiss: cue, guideLine: round.guideLine || first };
    return { state: withGame(state, withRound({ ...game, softMissLineSeen: true }, cued)), events: [{ type: 'SoftMiss', ...tap }] };
  }

  const solving = {
    ...round,
    softMiss: null,
    guideLine: false,
    presentation: beatAt('solve', game.clockMs, tuning, game),
    nextRoundId: inView.tier === round.plan.tiers ? ctx.entropy.ids[0] : null,
  };
  return { state: withGame(state, withRound(game, solving)), events: [{ type: 'PuzzleSolved', ...tap }] };
}

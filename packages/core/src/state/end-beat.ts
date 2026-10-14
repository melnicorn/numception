import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { pathFromTop } from '../rounds/path-from-top';
import { ROUND_TYPES } from '../rounds/round-types';
import type { TuningConfig } from '../tuning/tuning-config';
import { beatAt, idleAt } from './beat';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { isNodeSolved } from './is-node-solved';
import { nextUnsolved } from './next-unsolved';
import { nodeKey } from './node-key';
import type { Round } from './round';
import { serveNode } from './serve-node';
import { startRound } from './start-round';
import { withRound } from './with-round';

/** A game after part of its timeline ran, with the events that produced it. */
export type TimelineResult = { readonly game: GameState; readonly events: readonly GameEvent[] };

function invalid(message: string): DomainError {
  return { code: 'invalid-command', message };
}

/** `round` advancing from `atMs` to its next unsolved puzzle (AD-25), realised if new. */
function startAdvance(round: Round, atMs: number, tuning: TuningConfig, game: GameState): Result<Round, DomainError> {
  const next = nextUnsolved(round);
  if (next === undefined) return err(invalid('no unsolved puzzle to advance to'));
  const served = serveNode(round, next, tuning);
  if (!served.ok) return served;
  return ok({
    ...served.value,
    viewPath: pathFromTop(next, round.plan.tiers, round.plan.n),
    presentation: beatAt('advance', atMs, tuning, game),
    shownAtMs: null,
  });
}

/** `round` idle from `atMs` on the puzzle in view, which counts as shown from then. */
function settle(round: Round, atMs: number): Round {
  return { ...round, presentation: idleAt(atMs), shownAtMs: atMs };
}

/**
 * Ends the beat running on `game`'s active round at `endAt` and starts what follows
 * (AD-20), at `endAt` too:
 *
 * - `solve`: the node in view joins `solved`. If that completes the round
 *   (`RoundType.isComplete`): `RoundCompleted`, `roundOrdinal` + 1, and the next
 *   round (id `nextRoundId`) opens on `roundStart` (`RoundStarted`); the completed
 *   round is dropped. Else, if it completed a group (`RoundType.onSolve`), the view
 *   moves to the parent and a `collapse` runs (`RoundCollapsed`; the first one sets
 *   `firstCollapseSeen`). Else `advance`.
 * - `collapse`: `advance`, or idle when the parent collapsed into is itself the next puzzle.
 * - `advance`, `roundStart`: idle; the puzzle in view is shown from `endAt`.
 *
 * Errors (a leaf that cannot be realised, a round that cannot be planned) leave the
 * caller to reject; they cannot occur with a plan the planner accepted.
 */
export function endBeat(game: GameState, round: Round, endAt: number, tuning: TuningConfig): Result<TimelineResult, DomainError> {
  const inView = round.viewPath[round.viewPath.length - 1];
  if (inView === undefined) return err(invalid('no puzzle in view'));
  switch (round.presentation.kind) {
    case 'idle':
      return ok({ game, events: [] });
    case 'advance':
    case 'roundStart':
      return ok({ game: withRound(game, settle(round, endAt)), events: [] });
    case 'collapse': {
      const next = nextUnsolved(round);
      if (next !== undefined && next.tier === inView.tier && next.index === inView.index) {
        return ok({ game: withRound(game, settle(round, endAt)), events: [] });
      }
      const advanced = startAdvance(round, endAt, tuning, game);
      return advanced.ok ? ok({ game: withRound(game, advanced.value), events: [] }) : advanced;
    }
    case 'solve': {
      const solved: Round = { ...round, solved: [...round.solved, nodeKey(inView)] };
      const rt = ROUND_TYPES[round.type];
      const isSolved = (node: Parameters<typeof isNodeSolved>[1]) => isNodeSolved(solved, node);
      if (rt.isComplete(round.plan, isSolved)) return completeRound(game, round, endAt, tuning);
      const { collapsesInto } = rt.onSolve(round.plan, inView, isSolved);
      if (collapsesInto !== null) {
        const collapsing: Round = {
          ...solved,
          viewPath: pathFromTop(collapsesInto, round.plan.tiers, round.plan.n),
          presentation: beatAt('collapse', endAt, tuning, game),
          shownAtMs: null,
        };
        return ok({
          game: withRound({ ...game, firstCollapseSeen: true }, collapsing),
          events: [{ type: 'RoundCollapsed', roundId: round.roundId, nodeId: collapsesInto }],
        });
      }
      const advanced = startAdvance(solved, endAt, tuning, game);
      return advanced.ok ? ok({ game: withRound(game, advanced.value), events: [] }) : advanced;
    }
  }
}

/** The round's top was solved at `endAt`: it completes and the next one starts. */
function completeRound(game: GameState, round: Round, endAt: number, tuning: TuningConfig): Result<TimelineResult, DomainError> {
  const nextId = round.nextRoundId;
  if (nextId === null) return err(invalid('the next round has no reserved id'));
  const roundOrdinal = game.roundOrdinal + 1;
  const next = startRound(nextId, { ...game, roundOrdinal }, tuning, beatAt('roundStart', endAt, tuning, game), null);
  if (!next.ok) return next;
  const { [round.roundId]: _completed, ...rest } = game.rounds.byId;
  return ok({
    game: { ...game, roundOrdinal, rounds: { activeRoundId: nextId, byId: { ...rest, [nextId]: next.value } } },
    events: [
      { type: 'RoundCompleted', roundId: round.roundId, roundOrdinal: game.roundOrdinal },
      { type: 'RoundStarted', roundId: nextId, roundOrdinal },
    ],
  });
}

import type { DomainError } from '../result/domain-error';
import { isInRound, parentOf } from '../rounds/round-node-id';
import type { TuningConfig } from '../tuning/tuning-config';
import type { TuningsByVersion } from '../tuning/tunings-by-version';
import { activeRound } from './active-round';
import type { AppState } from './app-state';
import { idleAt } from './beat';
import { dropInput } from './drop-input';
import { isNodeSolved } from './is-node-solved';
import { isPlayable } from './is-playable';
import { nodeKey } from './node-key';
import { reject } from './reject';
import { sameNode } from './same-node';
import { serveNode } from './serve-node';
import type { StepResult } from './step-result';
import { withGame } from './with-game';
import { withRound } from './with-round';

const COMMAND = 'EnterPuzzle';

function invalid(message: string): DomainError {
  return { code: 'invalid-command', message };
}

/**
 * `EnterPuzzle { nodeId }` (FR-9, AD-25): from the overview in view, enters its
 * child `nodeId`, which must be unsolved with all its own children solved (leaves
 * always qualify). The puzzle is realised if new, pushed onto `viewPath` and shown
 * from now, idle. Dropped while a beat runs; anything else is rejected.
 */
export function reduceEnterPuzzle(state: AppState, nodeId: unknown, tuning: TuningConfig, tunings: TuningsByVersion): StepResult {
  const active = activeRound(state);
  if (active === undefined) return reject(state, COMMAND, invalid('no active round'));
  const { game, round } = active;
  if (round.presentation.kind !== 'idle') return dropInput(state, COMMAND, round.presentation.kind);
  if (!isInRound(nodeId, round.plan.tiers, round.plan.n)) return reject(state, COMMAND, invalid('nodeId is not a node of the active round'));
  const inView = round.viewPath[round.viewPath.length - 1];
  if (nodeId.tier >= round.plan.tiers || inView === undefined || !sameNode(inView, parentOf(nodeId, round.plan.n).parent)) {
    return reject(state, COMMAND, invalid(`${nodeKey(nodeId)} is not a cell of the overview in view`));
  }
  if (isNodeSolved(round, nodeId)) return reject(state, COMMAND, invalid(`${nodeKey(nodeId)} is already solved`));
  if (!isPlayable(round, nodeId)) return reject(state, COMMAND, invalid(`${nodeKey(nodeId)} has unsolved children`));
  const served = serveNode(round, nodeId, tuning, tunings);
  if (!served.ok) return reject(state, COMMAND, served.error);
  const entered = {
    ...served.value,
    viewPath: [...round.viewPath, { tier: nodeId.tier, index: nodeId.index }],
    softMiss: null,
    presentation: idleAt(game.clockMs),
    shownAtMs: game.clockMs,
  };
  return { state: withGame(state, withRound(game, entered)), events: [] };
}

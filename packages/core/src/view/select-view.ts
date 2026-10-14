import type { Operator } from '../generator/operator';
import { defaultShapeFor } from '../layout/default-shape-for';
import { SHAPES } from '../layout/shapes/shapes';
import { displayValue } from '../numbers/display-value';
import type { Presentation } from '../presentation/presentation';
import { childrenOf } from '../rounds/round-node-id';
import { activeRound } from '../state/active-round';
import type { AppState } from '../state/app-state';
import { isNodeSolved } from '../state/is-node-solved';
import { isPlayable } from '../state/is-playable';
import { roundPuzzle } from '../state/round-puzzle';
import type { TuningConfig } from '../tuning/tuning-config';
import { KILN_TOKENS } from './kiln-tokens';
import type { PlayCellVM, PlayVM, PresentationVM } from './play-vm';

const SYMBOLS: Readonly<Record<Operator, string>> = { add: '+', sub: '−' };

/** The beat's progress at play time `clockMs`, 0..1; idle (and zero-length beats) are 1. */
function presentationVM(p: Presentation, clockMs: number): PresentationVM {
  const progress = p.kind === 'idle' || p.durationMs <= 0 ? 1 : Math.min(1, Math.max(0, (clockMs - p.startedAtMs) / p.durationMs));
  return { kind: p.kind, progress, durationMs: p.durationMs, transitionId: p.transitionId };
}

/**
 * The play view of `state` (AD-13): the node at the end of the active round's
 * `viewPath`, drawn on its n's default shape (`defaultShapeFor`) in Kiln.
 *
 * - A puzzle view (a leaf, or a node whose children are all solved) shows its
 *   puzzle; cells of an upper tier are `solved`, showing each child's answer.
 * - An overview shows the node's children as cells: a solved child shows its
 *   answer (`solved`), an unsolved one shows no numeral, and `enters` it when its
 *   own children are all solved (leaves always).
 *
 * `inputLocked` and `presentation` come from the round's timeline at the profile's
 * Tick time. Null before a round exists. `tuning` is the active config (AD-13's
 * signature); this build reads nothing from it yet.
 */
export function selectView(state: AppState, _tuning: TuningConfig): PlayVM | null {
  const active = activeRound(state);
  const nodeId = active?.round.viewPath[active.round.viewPath.length - 1];
  if (active === undefined || nodeId === undefined) return null;
  const { game, round } = active;
  const puzzle = roundPuzzle(round, nodeId);
  const shapeId = defaultShapeFor(round.plan.n);
  if (puzzle === undefined || !shapeId.ok) return null;
  const layout = SHAPES[shapeId.value];
  const overview = !isPlayable(round, nodeId);
  const children = nodeId.tier > 1 ? childrenOf(nodeId, round.plan.n) : [];
  const cells = layout.cells.map((cell): PlayCellVM => {
    const child = children[cell.index];
    const value = puzzle.cells[cell.index];
    const solved = child !== undefined && isNodeSolved(round, child);
    const hidden = overview && !solved;
    return {
      index: cell.index,
      polygon: cell.polygon,
      labelPoint: cell.labelPoint,
      inscribedRadius: cell.inscribedRadius,
      text: value === undefined || hidden ? '' : displayValue(value),
      state: solved ? 'solved' : 'unsolved',
      enters: hidden && child !== undefined && isPlayable(round, child) ? child : null,
    };
  });
  return {
    nodeId,
    kind: overview ? 'overview' : 'puzzle',
    shapeId: shapeId.value,
    aspect: layout.aspect,
    cells,
    operator: { polygon: layout.operator.polygon, labelPoint: layout.operator.labelPoint, symbol: SYMBOLS[round.plan.operator] },
    inputLocked: round.presentation.kind !== 'idle',
    presentation: presentationVM(round.presentation, game.clockMs),
    theme: KILN_TOKENS,
  };
}

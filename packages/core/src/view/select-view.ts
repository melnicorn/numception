import type { Operator } from '../generator/operator';
import { defaultShapeFor } from '../layout/default-shape-for';
import { SHAPES } from '../layout/shapes/shapes';
import { displayValue } from '../numbers/display-value';
import { childrenOf } from '../rounds/round-node-id';
import type { AppState } from '../state/app-state';
import { nodeKey } from '../state/node-key';
import { roundPuzzle } from '../state/round-puzzle';
import type { TuningConfig } from '../tuning/tuning-config';
import { KILN_TOKENS } from './kiln-tokens';
import type { PlayCellVM, PlayVM } from './play-vm';

const SYMBOLS: Readonly<Record<Operator, string>> = { add: '+', sub: '−' };

/**
 * The play view of `state` (AD-13): the puzzle at the end of the active round's
 * `viewPath`, drawn on its n's default shape (`defaultShapeFor`) in Kiln. Cells of
 * an upper-tier puzzle are `solved` where their child puzzle is solved (they show
 * that child's answer, which is the cell's value). Null before a round exists.
 * `tuning` is the active config (AD-13's signature); this build reads nothing from it yet.
 */
export function selectView(state: AppState, _tuning: TuningConfig): PlayVM | null {
  const game = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  const roundId = game?.rounds.activeRoundId ?? null;
  const round = game === undefined || roundId === null ? undefined : game.rounds.byId[roundId];
  const nodeId = round?.viewPath[round.viewPath.length - 1];
  if (round === undefined || nodeId === undefined) return null;
  const puzzle = roundPuzzle(round, nodeId);
  const shapeId = defaultShapeFor(round.plan.n);
  if (puzzle === undefined || !shapeId.ok) return null;
  const layout = SHAPES[shapeId.value];
  const children = nodeId.tier > 1 ? childrenOf(nodeId, round.plan.n) : [];
  const cells = layout.cells.map((cell): PlayCellVM => {
    const child = children[cell.index];
    const value = puzzle.cells[cell.index];
    return {
      index: cell.index,
      polygon: cell.polygon,
      labelPoint: cell.labelPoint,
      inscribedRadius: cell.inscribedRadius,
      text: value === undefined ? '' : displayValue(value),
      state: child !== undefined && round.solved.includes(nodeKey(child)) ? 'solved' : 'unsolved',
    };
  });
  return {
    nodeId,
    shapeId: shapeId.value,
    aspect: layout.aspect,
    cells,
    operator: { polygon: layout.operator.polygon, labelPoint: layout.operator.labelPoint, symbol: SYMBOLS[round.plan.operator] },
    inputLocked: false,
    theme: KILN_TOKENS,
  };
}

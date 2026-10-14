import type { NodeId } from '../generator/node-id';
import type { Operator } from '../generator/operator';
import type { Puzzle } from '../generator/puzzle';
import { defaultShapeFor } from '../layout/default-shape-for';
import { SHAPES } from '../layout/shapes/shapes';
import { displayValue } from '../numbers/display-value';
import { childrenOf } from '../rounds/round-node-id';
import { isNodeSolved } from '../state/is-node-solved';
import { isPlayable } from '../state/is-playable';
import type { Round } from '../state/round';
import { roundPuzzle } from '../state/round-puzzle';
import { KILN_TOKENS } from './kiln-tokens';
import type { PlayCellVM, PlayVM, PresentationVM } from './play-vm';

const SYMBOLS: Readonly<Record<Operator, string>> = { add: '+', sub: '−' };

/** The presentation a nested (`from` / `to`) view carries: the beat's timing, no nested transition. */
export type NestedPresentation = Pick<PresentationVM, 'kind' | 'progress' | 'durationMs' | 'transitionId'>;

function nested(p: NestedPresentation): PresentationVM {
  return { kind: p.kind, progress: p.progress, durationMs: p.durationMs, transitionId: p.transitionId, cellIndex: null };
}

/**
 * The view of `node` of `round` (AD-13), drawn on its n's default shape in Kiln,
 * with `presentation` and `inputLocked` as given (no transitions nested in it).
 *
 * - A puzzle view (a leaf, or a node whose children are all solved) shows its
 *   puzzle; cells of an upper tier are `solved`, showing each child's answer.
 *   When `node` itself is solved, `solvedAnswer` is its answer cell.
 * - An overview shows the node's children as cells: a solved child shows its
 *   answer (`solved`), an unsolved one shows no numeral, and `enters` it when its
 *   own children are all solved (leaves always).
 *
 * Undefined when the node's puzzle is not realised or n has no shape.
 */
export function nodeView(round: Round, node: NodeId, presentation: NestedPresentation, inputLocked: boolean): PlayVM | undefined {
  const puzzle = roundPuzzle(round, node);
  const shapeId = defaultShapeFor(round.plan.n);
  if (puzzle === undefined || !shapeId.ok) return undefined;
  const layout = SHAPES[shapeId.value];
  const overview = !isPlayable(round, node);
  const children = node.tier > 1 ? childrenOf(node, round.plan.n) : [];
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
    nodeId: { tier: node.tier, index: node.index },
    kind: overview ? 'overview' : 'puzzle',
    shapeId: shapeId.value,
    aspect: layout.aspect,
    cells,
    operator: { polygon: layout.operator.polygon, labelPoint: layout.operator.labelPoint, symbol: SYMBOLS[round.plan.operator] },
    solvedAnswer: isNodeSolved(round, node) ? puzzle.answerIndex : null,
    inputLocked,
    presentation: nested(presentation),
    theme: KILN_TOKENS,
  };
}

/**
 * The view of a solved top puzzle on its own (the round before, for the
 * `roundStart` crossfade): every cell shows its value as a solved child's answer,
 * fused into the answer cell.
 */
export function solvedTopView(puzzle: Puzzle, presentation: NestedPresentation): PlayVM | undefined {
  const shapeId = defaultShapeFor(puzzle.spec.n);
  if (!shapeId.ok) return undefined;
  const layout = SHAPES[shapeId.value];
  return {
    nodeId: { tier: puzzle.nodeId.tier, index: puzzle.nodeId.index },
    kind: 'puzzle',
    shapeId: shapeId.value,
    aspect: layout.aspect,
    cells: layout.cells.map((cell) => {
      const value = puzzle.cells[cell.index];
      return {
        index: cell.index,
        polygon: cell.polygon,
        labelPoint: cell.labelPoint,
        inscribedRadius: cell.inscribedRadius,
        text: value === undefined ? '' : displayValue(value),
        state: 'solved',
        enters: null,
      };
    }),
    operator: { polygon: layout.operator.polygon, labelPoint: layout.operator.labelPoint, symbol: SYMBOLS[puzzle.spec.operator] },
    solvedAnswer: puzzle.answerIndex,
    inputLocked: true,
    presentation: nested(presentation),
    theme: KILN_TOKENS,
  };
}

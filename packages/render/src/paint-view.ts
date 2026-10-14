import type { LayoutPoint, PlayVM } from '@numception/app';
import { CONTEXT_STYLE, lerp, type LayerLook, mixColor } from './beat-motion';
import { numeralSize } from './numeral-size';
import type { ScenePool } from './scene-pool';
import { toScreen, type ViewTransform } from './view-transform';

/** Operands shrink to this share of their size as they fall into the centre. */
const OPERAND_SHRINK = 0.4;
/** Below this alpha an object is not drawn at all. */
const INVISIBLE = 0.002;

function hex(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16);
}

function mixPoint(a: LayoutPoint, b: LayoutPoint, t: number): LayoutPoint {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

/**
 * Draws `vm` into `pool` (AD-14): `t` places it on screen (the camera), `rest`
 * sets numeral sizes (`sizingTransform`: the idle transform in a collapse, so
 * answers ease 58 → 44 px in screen space rather than ballooning with the zoom;
 * the current one in an advance, so numerals stay in proportion to their tiles).
 * `look` says what the running beat does to it.
 *
 * Kiln at rest: a puzzle view's cells are open tiles (an upper tier's solved
 * cells cool to `cell-unsolved` once it opens); an overview's solved cells are
 * fired tiles and its operator is dimmed until its tier opens. A context parent
 * (entry 9) is drawn `quiet` (`CONTEXT_STYLE`).
 */
export function paintView(pool: ScenePool, vm: PlayVM, t: ViewTransform, rest: ViewTransform, look: LayerLook, frameWidth: number): void {
  const theme = vm.theme;
  const flat = (polygon: readonly LayoutPoint[]) => polygon.flatMap((p) => toScreen(t, p));
  const others = look.focus?.others ?? 1;
  const cellAlpha = (index: number) => look.alpha * (look.cellFade[index] ?? 1) * (look.focus === null || look.focus.cell === index ? 1 : others);
  // The context style, per cell: a focus cell is never quiet.
  const quietOf = (index: number) => (look.focus !== null && look.focus.cell === index ? 0 : look.quiet);
  const quietly = (value: number, q: number) => lerp(1, value, q);
  const operatorStrength = look.operator ?? (vm.kind === 'overview' ? theme.operatorDimAlpha : 1);
  const firedRest = vm.kind === 'overview' ? 1 : 0;
  const firedOf = (index: number, state: 'solved' | 'unsolved') =>
    index === look.answer ? 1 : state === 'solved' ? (look.fired ?? firedRest) : 0;
  const centre = vm.operator.labelPoint;
  const boostRatio = theme.numberSolvedSizePx / theme.numberSizePx;
  const fontFamily = theme.fontFamily;
  const fontWeight = theme.fontWeight;

  // A fully fused puzzle is one fired tile: nothing under it would show, and a
  // fading layer would otherwise let its seams show through.
  const fused = look.overlay >= 1;
  const background = pool.takeGraphics();
  const washAlpha = theme.operatorWashAlpha * look.alpha * others * quietly(CONTEXT_STYLE.tileAlpha, look.quiet);
  if (!fused && washAlpha > INVISIBLE) background.poly(flat(vm.operator.polygon)).fill({ color: hex(theme.operator), alpha: washAlpha });
  for (const cell of vm.cells) {
    const alpha = cellAlpha(cell.index);
    if (fused || alpha <= INVISIBLE) continue;
    const q = quietOf(cell.index);
    const fired = firedOf(cell.index, cell.state);
    background
      .poly(flat(cell.polygon))
      .fill({ color: mixColor(theme.cellFill, theme.solvedFill, fired), alpha: alpha * quietly(lerp(CONTEXT_STYLE.tileAlpha, CONTEXT_STYLE.firedTileAlpha, fired), q) })
      .stroke({ width: theme.lineWidth, color: hex(theme.line), alpha: alpha * quietly(CONTEXT_STYLE.lineAlpha, q), join: 'round' });
  }

  // A numeral in `number` on an open tile, `cell-solved-number` on a fired one. A
  // cooling tile swaps it at half-way: a blend of the two inks would match the
  // blended fill and vanish, a swap keeps the numeral readable throughout.
  const numeral = (text: string, at: LayoutPoint, size: number, fired: number, alpha: number, maxSize: number) => {
    const fontSize = Math.max(1, Math.round(maxSize));
    const fill = hex(fired >= 0.5 ? theme.solvedNumber : theme.number);
    const label = pool.takeText(text, { fontFamily, fontWeight, fontSize, fill });
    label.position.set(...toScreen(t, at));
    label.scale.set(size / fontSize);
    label.alpha = alpha;
  };

  let operatorBase = theme.numberSizePx;
  for (const cell of vm.cells) {
    const base = numeralSize(theme, rest, cell.inscribedRadius, frameWidth);
    operatorBase = base;
    if (fused || cell.text === '' || cell.index === look.answer) continue;
    const fade = look.operands;
    const q = quietOf(cell.index);
    const fired = firedOf(cell.index, cell.state);
    const quietAlpha = fired >= 0.5 ? CONTEXT_STYLE.solvedNumeralAlpha : CONTEXT_STYLE.numeralAlpha;
    const alpha = cellAlpha(cell.index) * (1 - fade) * quietly(quietAlpha, q);
    if (alpha <= INVISIBLE) continue;
    // With a focus cell (a collapse) the other answers follow `othersBoost`: they
    // start at the context parent's size, reach number-solved, then ease back.
    const boosted = look.focus !== null && look.focus.cell !== cell.index && look.othersBoost !== null ? look.othersBoost : look.boost;
    const boost = cell.state === 'solved' ? 1 + (boostRatio - 1) * boosted : 1;
    const size = base * boost * (1 - OPERAND_SHRINK * fade) * quietly(CONTEXT_STYLE.numeralScale, q);
    numeral(cell.text, mixPoint(cell.labelPoint, centre, fade), size, fired, alpha, base * boostRatio);
  }

  const operatorPx = vm.nodeId.tier > 1 ? theme.operatorTier2SizePx : theme.operatorSizePx;
  const operatorSize = ((operatorBase * operatorPx) / theme.numberSizePx) * quietly(CONTEXT_STYLE.numeralScale, look.quiet);
  const operatorAlpha = look.alpha * others * operatorStrength * (1 - look.operands) * quietly(CONTEXT_STYLE.numeralAlpha, look.quiet);
  if (!fused && operatorAlpha > INVISIBLE) {
    const fontSize = Math.max(1, Math.round(operatorSize));
    const symbol = pool.takeText(vm.operator.symbol, { fontFamily, fontWeight, fontSize, fill: hex(theme.operator) });
    symbol.position.set(...toScreen(t, centre));
    symbol.scale.set((operatorSize * (1 - OPERAND_SHRINK * look.operands)) / fontSize);
    symbol.alpha = operatorAlpha;
  }

  // The puzzle fusing into one fired tile: the whole shape fills over its seams.
  const overlayAlpha = look.overlay * look.alpha;
  if (overlayAlpha > INVISIBLE) {
    const overlay = pool.takeGraphics();
    const solved = hex(theme.solvedFill);
    for (const polygon of [vm.operator.polygon, ...vm.cells.map((c) => c.polygon)]) {
      overlay.poly(flat(polygon)).fill({ color: solved });
      // Covering the seams drawn beneath while they fade; a fused tile has none.
      if (!fused) overlay.stroke({ width: theme.lineWidth + 1, color: solved, join: 'round' });
    }
    overlay.alpha = overlayAlpha;
  }

  const answer = look.answer === null ? undefined : vm.cells[look.answer];
  if (answer !== undefined && answer.text !== '' && look.alpha > INVISIBLE) {
    const base = numeralSize(theme, rest, answer.inscribedRadius, frameWidth);
    const size = base * (1 + (boostRatio - 1) * look.grow);
    numeral(answer.text, mixPoint(answer.labelPoint, centre, look.grow), size, 1, look.alpha, base * boostRatio);
  }
}

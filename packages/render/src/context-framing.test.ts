import { type CameraRect, KILN_TOKENS, type LayoutPoint, type PlayCellVM, type PlayVM } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { cameraAt, collapseOthersBoost, collapseToLook, CONTEXT_STYLE, contextLook } from './beat-motion';
import { blendScale, numeralSize } from './numeral-size';
import { cellBox, contextTransform, fitRect, fitView, GUTTER_PX, idleTransform, nestTransform, shapeBox, toScreen, type ViewTransform } from './view-transform';

// 3A by hand (core/layout): a triangle on its circumcircle (r 0.5, apex at 12
// o'clock) split at its edge midpoints; cells top, lower right, lower left.
const h = Math.sqrt(3) / 4;
const top: LayoutPoint = [0.5, 0];
const right: LayoutPoint = [0.5 + h, 0.75];
const left: LayoutPoint = [0.5 - h, 0.75];
const mid = (a: LayoutPoint, b: LayoutPoint): LayoutPoint => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const mTR = mid(top, right);
const mRL = mid(right, left);
const mLT = mid(left, top);
const centroid = (ps: LayoutPoint[]): LayoutPoint => [ps.reduce((s, p) => s + p[0], 0) / 3, ps.reduce((s, p) => s + p[1], 0) / 3];
const polygons: LayoutPoint[][] = [
  [top, mTR, mLT],
  [right, mRL, mTR],
  [left, mLT, mRL],
];
/** A 3A cell's inscribed radius: side √3/4, so √3/4 / (2√3) = 1/8. */
const INSCRIBED = 0.125;

function cells(): PlayCellVM[] {
  return polygons.map((polygon, index) => ({
    index,
    polygon,
    labelPoint: centroid(polygon),
    inscribedRadius: INSCRIBED,
    text: String(index + 1),
    state: 'unsolved',
    enters: null,
  }));
}

type Placed = Pick<PlayVM, 'aspect' | 'cells' | 'operator' | 'context'>;
const bare: Placed = { aspect: 1, cells: cells(), operator: { polygon: [mTR, mRL, mLT], labelPoint: [0.5, 0.5], symbol: '+' } };

/** The context camera core gives cell `cell` (`contextCamera`, share 0.75). */
function contextCamera(cell: number): CameraRect {
  const box = cellBox(bare, cell);
  return { x: box.x - box.width / 6, y: box.y - box.height / 6, width: (box.width * 4) / 3, height: (box.height * 4) / 3 };
}

function leaf(cell: number): Placed {
  return { ...bare, context: { parent: { ...bare, aspect: 1 } as PlayVM, cellIndex: cell, camera: contextCamera(cell) } };
}

function close(a: ViewTransform, b: ViewTransform): void {
  expect(a.scale).toBeCloseTo(b.scale, 6);
  expect(a.left).toBeCloseTo(b.left, 6);
  expect(a.top).toBeCloseTo(b.top, 6);
}

const W = 390;
const H = 844;

describe('context framing (entry 9)', () => {
  it('without a context the idle transform is fitView', () => {
    expect(idleTransform(bare, W, H)).toEqual(fitView(bare, W, H));
  });

  it('a leaf takes about 75 % of the phone width inside its parent, and sits exactly on its parent cell', () => {
    for (const cell of [0, 1, 2]) {
      const vm = leaf(cell);
      const t = idleTransform(vm, W, H);
      const box = shapeBox(vm);
      const drawnWidth = box.width * t.scale;
      expect(drawnWidth / (W - 2 * GUTTER_PX)).toBeCloseTo(0.75, 6);
      const parentT = contextTransform(t, vm);
      if (parentT === undefined) throw new Error('no context');
      // The leaf's apex and base corners land on its parent cell's vertices.
      const [a, b, c] = polygons[cell] ?? [];
      const onScreen = [toScreen(t, top), toScreen(t, right), toScreen(t, left)];
      const parentCell = [a, b, c].map((p) => toScreen(parentT, p as LayoutPoint));
      for (const p of onScreen) {
        expect(parentCell.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6)).toBe(true);
      }
    }
  });

  it('the parent transform inverts the nesting', () => {
    const vm = leaf(1);
    const t = idleTransform(vm, W, H);
    const parentT = contextTransform(t, vm);
    if (parentT === undefined) throw new Error('no context');
    close(parentT, fitRect(contextCamera(1), 1, W, H));
    close(nestTransform(parentT, cellBox(bare, 1), shapeBox(vm), 1), t);
    expect(contextTransform(t, bare)).toBeUndefined();
  });

  it('the parent runs off the frame edges: a sibling cell is partly outside the frame', () => {
    const vm = leaf(0);
    const parentT = contextTransform(idleTransform(vm, W, H), vm);
    if (parentT === undefined) throw new Error('no context');
    const xs = [right, left].map((p) => toScreen(parentT, p)[0]);
    expect(Math.min(...xs)).toBeLessThan(0);
    expect(Math.max(...xs)).toBeGreaterThan(W);
  });

  it('keeps the Kid tap floor at 390 × 844: every leaf cell’s inscribed circle is at least 56 pt, and numerals keep their hero size', () => {
    for (const cell of [0, 1, 2]) {
      const t = idleTransform(leaf(cell), W, H);
      const diameter = 2 * INSCRIBED * t.scale;
      expect(diameter).toBeGreaterThanOrEqual(56);
      // About 77 pt; numerals stay within 10 % of the full-frame size.
      expect(numeralSize({ numberSizePx: 44 }, t, INSCRIBED, W)).toBeGreaterThan(0.9 * numeralSize({ numberSizePx: 44 }, fitView(bare, W, H), INSCRIBED, W));
    }
  });

  it('a beat camera at either end lands exactly on the idle framing', () => {
    // A leaf's idle camera in its own box: its context camera mapped through the nesting.
    const vm = leaf(2);
    const t = idleTransform(vm, W, H);
    const parentT = fitRect(contextCamera(2), 1, W, H);
    const s = nestTransform({ scale: 1, left: 0, top: 0, aspect: 1 }, cellBox(bare, 2), shapeBox(vm), 1);
    const cam = contextCamera(2);
    const own: CameraRect = { x: (cam.x - s.left) / s.scale, y: (cam.y - s.top) / s.scale, width: cam.width / s.scale, height: cam.height / s.scale };
    close(fitRect(own, 1, W, H), t);
    // Collapse at progress 0: the parent drawn at the child's context camera is the context parent at idle.
    const collapseStart = fitRect(cameraAt({ from: cam, to: shapeBox(bare) }, 0), 1, W, H);
    close(collapseStart, parentT);
    close(fitRect(cameraAt({ from: cam, to: shapeBox(bare) }, 1), 1, W, H), fitView(bare, W, H));
  });
});

describe('context looks', () => {
  it('a context parent is fully quiet; a collapse’s parent starts quiet and settles into the full puzzle', () => {
    expect(contextLook({ 1: 0 })).toMatchObject({ alpha: 1, quiet: 1, focus: null, cellFade: { 1: 0 } });
    expect(contextLook({}, 0.4).alpha).toBe(0.4);
    const start = collapseToLook(0, 0, 0.32);
    expect(start.quiet).toBe(1);
    expect(start.focus).toEqual({ cell: 0, others: 1 });
    expect(collapseToLook(0, 0.6, 0.32).quiet).toBeCloseTo(0, 9);
    expect(collapseToLook(0, 1, 0.32).quiet).toBe(0);
  });

  it('the context style is quieter than the puzzle on every channel but solved answers’ alpha', () => {
    const { solvedNumeralAlpha, ...rest } = CONTEXT_STYLE;
    expect(solvedNumeralAlpha).toBeLessThanOrEqual(1);
    for (const value of Object.values(rest)) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('a solved sibling’s answer keeps at least 3:1 against its quiet fired tile on the surface (Kiln)', () => {
    const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
    // Alpha compositing in sRGB, as the canvas does.
    const over = (fg: number[], alpha: number, bg: number[]) => fg.map((c, i) => alpha * c + (1 - alpha) * (bg[i] ?? 0));
    const luminance = (c: number[]) => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
    };
    const contrast = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
    };
    const tile = over(rgb(KILN_TOKENS.solvedFill), CONTEXT_STYLE.firedTileAlpha, rgb(KILN_TOKENS.surface));
    const ink = over(rgb(KILN_TOKENS.solvedNumber), CONTEXT_STYLE.solvedNumeralAlpha, tile);
    expect(contrast(ink, tile)).toBeGreaterThanOrEqual(3);
    // Still quieter than the puzzle's own fired tile and answer.
    expect(contrast(ink, tile)).toBeLessThan(contrast(rgb(KILN_TOKENS.solvedNumber), rgb(KILN_TOKENS.solvedFill)));
  });

  it('a collapse’s other answers start at the context size, reach number-solved as the context style lifts, then ease back', () => {
    expect(collapseOthersBoost(0)).toBe(0);
    expect(collapseOthersBoost(0.6)).toBeCloseTo(1, 9);
    expect(collapseToLook(0, 0.6, 0.32).quiet).toBeCloseTo(0, 9);
    expect(collapseOthersBoost(0.8)).toBeGreaterThan(0);
    expect(collapseOthersBoost(0.8)).toBeLessThan(1);
    expect(collapseOthersBoost(1)).toBe(0);
    expect(collapseToLook(0, 0.3, 0.32).othersBoost).toBe(collapseOthersBoost(0.3));
  });

  it('blendScale runs geometrically from one sizing scale to the other', () => {
    const a = fitView(bare, W, H);
    const b = { ...a, scale: a.scale * 4 };
    expect(blendScale(a, b, 0).scale).toBeCloseTo(a.scale, 9);
    expect(blendScale(a, b, 0.5).scale).toBeCloseTo(a.scale * 2, 9);
    expect(blendScale(a, b, 1).scale).toBeCloseTo(b.scale, 9);
  });
});

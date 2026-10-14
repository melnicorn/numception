import { KILN_TOKENS, type LayoutPoint, type PlayVM, type ThemeTokens } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { IDLE_LOOK } from './beat-motion';
import { paintView } from './paint-view';
import type { ScenePool, TextLook } from './scene-pool';
import { fitView, type ViewTransform } from './view-transform';

// 3A by hand: three cells and the centre operator in the unit box.
const h = Math.sqrt(3) / 4;
const top: LayoutPoint = [0.5, 0];
const right: LayoutPoint = [0.5 + h, 0.75];
const left: LayoutPoint = [0.5 - h, 0.75];
const mid = (a: LayoutPoint, b: LayoutPoint): LayoutPoint => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const [mTR, mRL, mLT] = [mid(top, right), mid(right, left), mid(left, top)];
const polygons: LayoutPoint[][] = [
  [top, mTR, mLT],
  [right, mRL, mTR],
  [left, mLT, mRL],
];

const LIGHT: ThemeTokens = { ...KILN_TOKENS, themeId: 'light', fontWeight: '300', fontWeightSolved: '400' };

const vm = {
  nodeId: { tier: 1, index: 0 },
  kind: 'puzzle',
  shapeId: '3A',
  aspect: 1,
  cells: polygons.map((polygon, index) => ({ index, polygon, labelPoint: polygon[0] as LayoutPoint, inscribedRadius: 0.125, text: String(index + 1), state: 'unsolved', enters: null })),
  operator: { polygon: [mTR, mRL, mLT], labelPoint: [0.5, 0.5], symbol: '+' },
  solvedAnswer: null,
  inputLocked: false,
  blurred: false,
  presentation: { kind: 'idle', progress: 1, durationMs: 0, transitionId: 'none', cellIndex: null },
  theme: LIGHT,
} as unknown as PlayVM;

/** A pool that records each Text's look (the graphics calls are no-ops). */
function recordingPool(): { pool: ScenePool; looks: TextLook[] } {
  const looks: TextLook[] = [];
  const g: Record<string, unknown> = {};
  for (const name of ['poly', 'fill', 'stroke', 'moveTo', 'lineTo', 'rect', 'circle']) g[name] = () => g;
  const pool = {
    takeGraphics: () => g,
    takeText: (_text: string, look: TextLook) => {
      looks.push(look);
      return { position: { set() {} }, scale: { set() {} }, alpha: 1 };
    },
  } as unknown as ScenePool;
  return { pool, looks };
}

function weights(t: ViewTransform, rest: ViewTransform, weightRest?: { rest: ViewTransform; quiet: number }): string[] {
  const { pool, looks } = recordingPool();
  paintView(pool, vm, t, rest, IDLE_LOOK, 390, weightRest);
  return looks.map((l) => l.fontWeight);
}

describe('numeral weights (DESIGN numeral-min-weight)', () => {
  const idle = fitView(vm, 390, 844);
  const small = { ...idle, scale: idle.scale * 0.3 };

  it('a light face stays light at its hero size, and is raised to 400 below 32 px at rest', () => {
    expect(weights(idle, idle)).toEqual(['300', '300', '300', '300']);
    expect(weights(small, small)).toEqual(['400', '400', '400', '400']);
  });

  it('keeps one weight through a beat: the animated size never picks it, the rest size does', () => {
    // An advance-like beat: the layer is drawn (and sized) far smaller than at rest, every frame.
    for (const k of [1, 0.8, 0.5, 0.3, 0.2]) {
      const t = { ...idle, scale: idle.scale * k };
      expect(weights(t, t, { rest: idle, quiet: 0 })).toEqual(['300', '300', '300', '300']);
    }
  });
});

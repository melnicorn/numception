import type { CameraRect } from '@numception/app';
import { describe, expect, it } from 'vitest';
import {
  advanceCameraT,
  cameraAt,
  collapseCameraT,
  collapseToLook,
  easeOut,
  mixColor,
  ramp,
  solveLook,
} from './beat-motion';
import { fitRect, fitView, nestTransform, shapeBox, toScreen } from './view-transform';

const full: CameraRect = { x: 0.067, y: 0, width: 0.866, height: 0.75 };
const topCell: CameraRect = { x: 0.2835, y: 0, width: 0.433, height: 0.375 };

describe('eases', () => {
  it('ramp and easeOut stay in 0..1 and ease-out never accelerates', () => {
    expect(ramp(-1, 0, 1)).toBe(0);
    expect(ramp(2, 0, 1)).toBe(1);
    expect(ramp(0.5, 0.25, 0.75)).toBeCloseTo(0.5);
    let lastStep = Number.POSITIVE_INFINITY;
    for (let i = 1; i <= 100; i += 1) {
      const step = easeOut(i / 100) - easeOut((i - 1) / 100);
      expect(step).toBeLessThanOrEqual(lastStep + 1e-12);
      lastStep = step;
    }
    expect(advanceCameraT(0)).toBe(0);
    expect(advanceCameraT(1)).toBe(1);
    expect(collapseCameraT(0.3)).toBeCloseTo(0.3);
  });

  it('mixes colours channel by channel', () => {
    expect(mixColor('#000000', '#FFFFFF', 0)).toBe(0x000000);
    expect(mixColor('#000000', '#FFFFFF', 1)).toBe(0xffffff);
    expect(mixColor('#A14E36', '#F6F0E8', 0)).toBe(0xa14e36);
  });
});

describe('cameraAt', () => {
  it('runs from camera.from to camera.to', () => {
    expect(cameraAt({ from: topCell, to: full }, 0)).toEqual(topCell);
    expect(cameraAt({ from: topCell, to: full }, 1)).toEqual(full);
  });

  it('zooms at constant velocity: the scale grows by the same factor every equal step', () => {
    const camera = { from: topCell, to: full };
    const widths = [0, 0.25, 0.5, 0.75, 1].map((t) => cameraAt(camera, t).width);
    const ratios = widths.slice(1).map((w, i) => w / (widths[i] ?? 1));
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0] ?? 0, 9);
  });

  it('keeps the homothety centre still on screen (a pure zoom, no drift)', () => {
    const camera = { from: topCell, to: full };
    // The fixed point of topCell → full.
    const k = full.width / topCell.width;
    const px = (full.x + full.width / 2 - k * (topCell.x + topCell.width / 2)) / (1 - k);
    const py = (full.y + full.height / 2 - k * (topCell.y + topCell.height / 2)) / (1 - k);
    const screen = (t: number) => toScreen(fitRect(cameraAt(camera, t), 1, 375, 667), [px, py]);
    const [x0, y0] = screen(0);
    for (const t of [0.2, 0.5, 0.9]) {
      const [x, y] = screen(t);
      expect(x).toBeCloseTo(x0, 6);
      expect(y).toBeCloseTo(y0, 6);
    }
  });

  it('pans in a straight line between rects of one size', () => {
    const a = { x: 0, y: 0, width: 0.5, height: 0.5 };
    const b = { x: 0.5, y: 0.25, width: 0.5, height: 0.5 };
    expect(cameraAt({ from: a, to: b }, 0.5)).toEqual({ x: 0.25, y: 0.125, width: 0.5, height: 0.5 });
  });
});

describe('camera transforms', () => {
  const vm = {
    aspect: 1,
    cells: [
      {
        index: 0,
        polygon: [
          [0.5, 0],
          [0.933, 0.75],
          [0.067, 0.75],
        ] as [number, number][],
        labelPoint: [0.5, 0.5] as [number, number],
        inscribedRadius: 0.125,
        text: '1',
        state: 'unsolved' as const,
        enters: null,
      },
    ],
    operator: { polygon: [], labelPoint: [0.5, 0.5] as [number, number], symbol: '+' },
  };

  it('fitting the shape box is the idle fitView', () => {
    expect(fitRect(shapeBox(vm), 1, 375, 667)).toEqual(fitView(vm, 375, 667));
  });

  it('a view nested at camera.from fills the frame exactly as it does at idle when the camera is at camera.from', () => {
    const outer = fitRect(topCell, 1, 375, 667);
    const nested = nestTransform(outer, topCell, shapeBox(vm), 1);
    const idle = fitView(vm, 375, 667);
    expect(nested.scale).toBeCloseTo(idle.scale, 6);
    expect(nested.left).toBeCloseTo(idle.left, 6);
    expect(nested.top).toBeCloseTo(idle.top, 6);
  });
});

describe('beat looks', () => {
  it('solve: the answer fires at once, then grows; operands and seams are gone by the end', () => {
    expect(solveLook(1, 0)).toMatchObject({ answer: 1, grow: 0, operands: 0, overlay: 0 });
    expect(solveLook(1, 1)).toMatchObject({ answer: 1, grow: 1, operands: 1, overlay: 1 });
    // Seams fade last.
    expect(solveLook(1, 0.3).overlay).toBeLessThan(solveLook(1, 0.3).operands);
  });

  it('collapse: the parent takes over from its quiet context look, its answers ease back and its operator rises', () => {
    const start = collapseToLook(2, 0, 0.32);
    const end = collapseToLook(2, 1, 0.32);
    expect(start).toMatchObject({ fired: 1, boost: 1, operator: 0.32, focus: { cell: 2, others: 1 }, quiet: 1 });
    expect(end).toMatchObject({ fired: 0, boost: 0, operator: 1, focus: { cell: 2, others: 1 }, quiet: 0 });
  });
});

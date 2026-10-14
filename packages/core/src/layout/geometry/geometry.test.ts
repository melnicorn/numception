import { describe, expect, it } from 'vitest';
import type { LayoutPolygon } from '../shape-layout';
import { distanceToEdges, distanceToSegment } from './edge-distance';
import { counterClockwise, signedArea } from './orientation';
import { placeLabel } from './place-label';
import { pointInPolygon } from './point-in-polygon';
import { sharedSegments } from './shared-segments';

// Screen counter-clockwise (y down): top-left, bottom-left, bottom-right, top-right.
const square: LayoutPolygon = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
];

describe('layout geometry', () => {
  it('orients polygons counter-clockwise on screen', () => {
    expect(signedArea(square)).toBe(-1);
    const reversed = [...square].reverse();
    expect(signedArea(reversed)).toBe(1);
    expect(counterClockwise(reversed)).toEqual(square);
    expect(counterClockwise(square)).toBe(square);
  });

  it('tests containment and edge distance', () => {
    expect(pointInPolygon([0.5, 0.5], square)).toBe(true);
    expect(pointInPolygon([1.5, 0.5], square)).toBe(false);
    expect(distanceToSegment([0.5, 2], [[0, 0], [1, 0]])).toBe(2);
    expect(distanceToSegment([2, 0], [[0, 0], [1, 0]])).toBe(1);
    expect(distanceToEdges([0.25, 0.5], square)).toBe(0.25);
  });

  it('finds partial collinear overlaps, not lone shared vertices', () => {
    const right: LayoutPolygon = [
      [1, 0.5],
      [1, 2],
      [2, 2],
      [2, 0.5],
    ];
    expect(sharedSegments(square, [right])).toEqual([
      [
        [1, 1],
        [1, 0.5],
      ],
    ]);
    const corner: LayoutPolygon = [
      [1, 1],
      [1, 2],
      [2, 2],
    ];
    expect(sharedSegments(square, [corner])).toEqual([]);
  });

  it('places a label at the widest point of an axis', () => {
    const { labelPoint, inscribedRadius } = placeLabel(square, [0.5, 0], [0.5, 1]);
    expect(labelPoint[0]).toBe(0.5);
    expect(labelPoint[1]).toBeCloseTo(0.5, 6);
    expect(inscribedRadius).toBeCloseTo(0.5, 6);
  });
});

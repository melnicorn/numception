import type { ShapeLayout } from '../shape-layout';
import { wedgeRing } from './wedge-ring';

// 9B nonagon wedges (DESIGN.md § Shapes): nine trapezoid wedges around a carved
// nonagon void at 44% of the radius (mockups/shape-system-1.html).

/** 9B: nonagon wedges with a carved void, n = 9. */
export const SHAPE_9B: ShapeLayout = { shapeId: '9B', n: 9, aspect: 1, nesting: 'contains', ...wedgeRing(9, 0.44 * 0.5) };

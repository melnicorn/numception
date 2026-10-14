import type { ShapeLayout } from '../shape-layout';
import { wedgeRing } from './wedge-ring';

// 7A heptagon wedges (DESIGN.md § Shapes): seven trapezoid wedges around a
// carved heptagon void at 42% of the radius (mockups/shape-system-1.html).

/** 7A: heptagon wedges with a carved void, n = 7. */
export const SHAPE_7A: ShapeLayout = { shapeId: '7A', n: 7, aspect: 1, nesting: 'contains', ...wedgeRing(7, 0.42 * 0.5) };

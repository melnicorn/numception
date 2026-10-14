import type { ShapeId } from '../shape-id';
import type { ShapeLayout } from '../shape-layout';
import { SHAPE_3A } from './shape-3a';
import { SHAPE_4A } from './shape-4a';
import { SHAPE_5B } from './shape-5b';
import { SHAPE_6A } from './shape-6a';
import { SHAPE_7A } from './shape-7a';
import { SHAPE_8A } from './shape-8a';
import { SHAPE_9B } from './shape-9b';

/** Every shape's layout, by id (A4). Open for the 7B and 9C backups (OQ-11). */
export const SHAPES: Readonly<Record<ShapeId, ShapeLayout>> = {
  '3A': SHAPE_3A,
  '4A': SHAPE_4A,
  '5B': SHAPE_5B,
  '6A': SHAPE_6A,
  '7A': SHAPE_7A,
  '8A': SHAPE_8A,
  '9B': SHAPE_9B,
};

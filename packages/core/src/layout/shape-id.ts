/**
 * The POC shape picks, one per n (DESIGN.md § Shapes, addendum A4). The id is
 * the n plus the candidate letter from the shape study. Backups such as 7B and
 * 9C (OQ-11) slot in here when they get geometry.
 */
export const SHAPE_IDS = ['3A', '4A', '5B', '6A', '7A', '8A', '9B'] as const;

/** A shape with layout geometry in `SHAPES`. */
export type ShapeId = (typeof SHAPE_IDS)[number];

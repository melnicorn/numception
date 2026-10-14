import type { LayoutPoint, NodeCellRef, PlayVM } from '@numception/app';

/**
 * The renderer port (AD-14), minus `play(events)`, which arrives with the
 * presentation timeline (entry 3). Points are CSS px relative to the mount element.
 */
export type RenderPort = {
  /** Creates the canvas inside `el`; resolves once the first frame can be drawn. */
  readonly mount: (el: HTMLElement) => Promise<void>;
  /** Rebuilds the scene from `vm` (no retained game state). Null draws an empty surface. */
  readonly render: (vm: PlayVM | null) => void;
  /** The cell under `point`, or null (operator, shared edges, outside, `inputLocked`). */
  readonly hitTest: (point: LayoutPoint) => NodeCellRef | null;
  readonly destroy: () => void;
};

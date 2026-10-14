import type { NodeId } from '../generator/node-id';
import type { ShapeLayout } from '../layout/shape-layout';
import { pathFromTop } from '../rounds/path-from-top';
import { parentOf } from '../rounds/round-node-id';
import { isPlayable } from '../state/is-playable';
import type { Round } from '../state/round';
import { sameNode } from '../state/same-node';
import { idleCamera, relativeCamera } from './camera-rect';
import { type NestedPresentation, nodeView, solvedTopView } from './node-view';
import type { PlayVM, PresentationVM } from './play-vm';

/** What a beat adds to the view's presentation (`PresentationVM`), beyond its timing. */
export type BeatExtras = Pick<PresentationVM, 'cellIndex' | 'from' | 'to' | 'camera'>;

/** The child cell taken at each tier from the round's top down to `node` (empty for the top). */
function cellPath(node: NodeId, tiers: number, n: number): number[] {
  return pathFromTop(node, tiers, n)
    .slice(1)
    .map((x) => parentOf(x, n).cell);
}

/** The node solved last, parsed from its `NodeKey`. */
function lastSolved(round: Round): NodeId | undefined {
  const key = round.solved[round.solved.length - 1];
  const [tier, index] = (key ?? '').split('.').map(Number);
  return tier === undefined || index === undefined || Number.isNaN(tier) || Number.isNaN(index) ? undefined : { tier, index };
}

/**
 * The puzzle an `advance` beat leaves (AD-25), from the round's state as the beat
 * runs (core keeps no record of it): the node solved last, unless that solve
 * completed its parent's group. Then a collapse into the parent ran first, and the
 * advance leaves the parent.
 */
function advanceFrom(round: Round): NodeId | undefined {
  const last = lastSolved(round);
  if (last === undefined || last.tier >= round.plan.tiers) return last;
  const { parent } = parentOf(last, round.plan.n);
  return isPlayable(round, parent) ? parent : last;
}

/**
 * The views and camera the running beat draws (see `PresentationVM`), derived from
 * the round as it is during the beat: core's timeline has already moved `viewPath`
 * to where the beat lands, so `to` is the view itself and `from` is reconstructed.
 *
 * - `solve`: the tapped answer is the puzzle's answer cell (`answerIndex`).
 * - `collapse`: `from` is the child solved last, inside its cell (`cellIndex`) of `to`.
 * - `advance`: `from` is `advanceFrom`; the camera pans between the two frames in
 *   the round's top geometry, so it moves through their shared ancestors.
 * - Both cameras run between the two views' idle framings (`idleCamera`): with
 *   the parent drawn around a puzzle (entry 9) a collapse pulls out from the
 *   child's context framing to the parent's own (its whole shape, or its context
 *   in the grandparent), and an advance pans inside the shared parent.
 * - `from` and `to` carry their own `context`, so render keeps the parent framing
 *   throughout.
 * - `roundStart`: `from` is the last round's top (`Round.previousTop`).
 *
 * A `from` that cannot be found (it cannot happen through `step`) is left out, and
 * render then draws `to` alone.
 */
export function beatViews(round: Round, to: PlayVM, layout: ShapeLayout, beat: NestedPresentation, answerIndex: number | null): BeatExtras {
  const { tiers, n } = round.plan;
  const toPath = cellPath(to.nodeId, tiers, n);
  const camera = (from: NodeId) => {
    const fromPath = cellPath(from, tiers, n);
    return { from: idleCamera(layout, fromPath, toPath), to: idleCamera(layout, toPath, toPath), fromBox: relativeCamera(layout, fromPath, toPath) };
  };
  switch (beat.kind) {
    case 'idle':
      return { cellIndex: null };
    case 'solve':
      return { cellIndex: answerIndex };
    case 'collapse': {
      const child = lastSolved(round);
      const from = child === undefined ? undefined : nodeView(round, child, beat, true);
      if (child === undefined || from === undefined || child.tier >= tiers || !sameNode(parentOf(child, n).parent, to.nodeId)) {
        return { cellIndex: null };
      }
      return { cellIndex: parentOf(child, n).cell, from, to, camera: camera(child) };
    }
    case 'advance': {
      const node = advanceFrom(round);
      const from = node === undefined ? undefined : nodeView(round, node, beat, true);
      return node === undefined || from === undefined ? { cellIndex: null } : { cellIndex: null, from, to, camera: camera(node) };
    }
    case 'roundStart': {
      const from = round.previousTop === null ? undefined : solvedTopView(round.previousTop, beat);
      return from === undefined ? { cellIndex: null } : { cellIndex: null, from, to };
    }
  }
}

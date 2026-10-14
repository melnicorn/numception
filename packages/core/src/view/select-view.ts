import { defaultShapeFor } from '../layout/default-shape-for';
import { SHAPES } from '../layout/shapes/shapes';
import type { Presentation } from '../presentation/presentation';
import { activeRound } from '../state/active-round';
import type { AppState } from '../state/app-state';
import type { NodeId } from '../generator/node-id';
import type { Round } from '../state/round';
import { sameNode } from '../state/same-node';
import { roundPuzzle } from '../state/round-puzzle';
import type { TuningConfig } from '../tuning/tuning-config';
import { beatViews } from './beat-views';
import { type NestedPresentation, nodeView } from './node-view';
import type { PlayVM, SoftMissVM } from './play-vm';

/** The guide line a profile's first soft miss raises (FR-4). */
export const GUIDE_LINE_TEXT = 'Tap the answer';

/** The round's soft-miss cue at play time `clockMs`, or undefined when none is running. */
function softMissAt(cue: Round['softMiss'], nodeId: NodeId, clockMs: number): SoftMissVM | undefined {
  if (cue === null || cue.durationMs <= 0 || !sameNode(cue.nodeId, nodeId)) return undefined;
  const progress = (clockMs - cue.startedAtMs) / cue.durationMs;
  if (progress >= 1) return undefined;
  return { cellIndex: cue.cellIndex, answerIndex: cue.answerIndex, progress: Math.max(0, progress) };
}

/** The beat's progress at play time `clockMs`, 0..1; idle (and zero-length beats) are 1. */
function timing(p: Presentation, clockMs: number): NestedPresentation {
  const progress = p.kind === 'idle' || p.durationMs <= 0 ? 1 : Math.min(1, Math.max(0, (clockMs - p.startedAtMs) / p.durationMs));
  return { kind: p.kind, progress, durationMs: p.durationMs, transitionId: p.transitionId };
}

/**
 * The play view of `state` (AD-13): the node at the end of the active round's
 * `viewPath` (see `nodeView`), drawn on its n's default shape in Kiln.
 *
 * `inputLocked` and `presentation` come from the round's timeline at the profile's
 * Tick time; `presentation` also carries what the running beat draws (`beatViews`:
 * the tapped answer, `from` / `to` views and the camera). `blurred` is the `blur`
 * pause reason (AD-17). `softMiss` is the round's soft-miss cue while it runs
 * and `guideLine` its guide line while up (FR-4). Null before a round
 * exists. `tuning` is the active config (AD-13's signature); this build reads
 * nothing from it yet.
 */
export function selectView(state: AppState, _tuning: TuningConfig): PlayVM | null {
  const active = activeRound(state);
  const nodeId = active?.round.viewPath[active.round.viewPath.length - 1];
  if (active === undefined || nodeId === undefined) return null;
  const { game, round } = active;
  const beat = timing(round.presentation, game.clockMs);
  const inputLocked = round.presentation.kind !== 'idle';
  const view = nodeView(round, nodeId, beat, inputLocked);
  const shapeId = defaultShapeFor(round.plan.n);
  if (view === undefined || !shapeId.ok) return null;
  const puzzle = roundPuzzle(round, nodeId);
  const extra = beatViews(round, view, SHAPES[shapeId.value], beat, puzzle?.answerIndex ?? null);
  const blurred = state.pauseReasons.includes('blur');
  const softMiss = view.kind === 'puzzle' ? softMissAt(round.softMiss, nodeId, game.clockMs) : undefined;
  const shown: PlayVM = {
    ...view,
    blurred,
    presentation: { ...view.presentation, ...extra },
    ...(softMiss === undefined || blurred ? {} : { softMiss }),
    // The veiled board's first tap only unblurs, so the line waits until the veil lifts.
    ...(round.guideLine && !blurred ? { guideLine: GUIDE_LINE_TEXT } : {}),
  };
  return blurred ? hideValues(shown) : shown;
}

/**
 * A veiled board shows no values (AD-17, AD-8): play time is stopped while paused,
 * so the numbers must not be readable then, or a player could work out the answer
 * off the clock. Every numeral (cells, the solved answer, the parent drawn around
 * the puzzle) is blanked; geometry stays, so the first tap still hit-tests and only
 * lifts the veil. A pause completes any beat first, so there are no beat views here.
 */
function hideValues(view: PlayVM): PlayVM {
  const blank = <T extends { readonly text: string }>(cell: T): T => ({ ...cell, text: '' });
  return {
    ...view,
    cells: view.cells.map(blank),
    ...(view.context === undefined
      ? {}
      : { context: { ...view.context, parent: { ...view.context.parent, cells: view.context.parent.cells.map(blank) } } }),
  };
}

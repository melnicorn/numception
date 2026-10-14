import type { PlayVM } from '@numception/app';

/**
 * What a frame is drawn from: the view, with a running beat reduced to its kind,
 * transition, progress and tapped cell (its `from` / `to` views follow from those
 * and the view). Two views with the same key draw the same frame, so render skips
 * the redraw; a beat's every new progress or transitionId redraws (AD-14), and so
 * does a soft-miss cue's. The guide line is DOM (AD-13), so it never redraws the canvas.
 */
export function drawKey(vm: PlayVM | null): string {
  if (vm === null) return 'null';
  const { presentation: p, inputLocked: _inputLocked, guideLine: _guideLine, ...drawn } = vm;
  const beat = p.kind === 'idle' ? null : [p.kind, p.transitionId, p.progress, p.cellIndex];
  return JSON.stringify({ ...drawn, beat });
}

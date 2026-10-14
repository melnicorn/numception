import type { PlayVM } from '@numception/app';

/**
 * What the scene is built from: the view without its presentation timeline
 * (`presentation`, `inputLocked`). Two views with the same key draw the same scene,
 * so a frame that only moves a beat's progress skips the rebuild until transitions
 * are drawn (entry 3).
 */
export function drawKey(vm: PlayVM | null): string {
  if (vm === null) return 'null';
  const { presentation: _presentation, inputLocked: _inputLocked, ...drawn } = vm;
  return JSON.stringify(drawn);
}

import { activeRound } from './active-round';
import type { AppState } from './app-state';
import type { StepResult } from './step-result';

/**
 * What input (`TapCell`, `EnterPuzzle`, `ZoomOut`) does while paused (AD-17), or
 * undefined when nothing pauses and the input runs as usual:
 *
 * - Any reason but `blur` (backgrounded, a panel or the gate open): dropped,
 *   `InputDropped` with the reasons, nothing changes.
 * - Only `blur` left: the input clears it (`BlurCleared`) and does nothing else:
 *   it is not classified, scored or timed.
 */
export function gateInput(state: AppState, command: string): StepResult | undefined {
  const reasons = state.pauseReasons;
  if (reasons.length === 0) return undefined;
  if (reasons.some((r) => r !== 'blur')) {
    const presentation = activeRound(state)?.round.presentation.kind ?? 'idle';
    return { state, events: [{ type: 'InputDropped', command, presentation, pauseReasons: reasons }] };
  }
  return { state: { ...state, pauseReasons: [] }, events: [{ type: 'BlurCleared' }] };
}

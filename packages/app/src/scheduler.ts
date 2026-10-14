import type { Command, GameEvent, PauseReason } from '@numception/core';
import type { Game } from './game';

export type { PauseReason } from '@numception/core';

/** The client's frame loop, e.g. `requestAnimationFrame` / `cancelAnimationFrame`. */
export type FrameLoop = {
  readonly request: (callback: () => void) => number;
  readonly cancel: (handle: number) => void;
};

export type SchedulerOptions = {
  readonly game: Game;
  /** The monotonic clock, ms (e.g. `performance.now`): the only clock read for game-meaningful time. */
  readonly now: () => number;
  readonly frames: FrameLoop;
};

/** The play clock (AD-17): the one dispatcher of `Tick`. */
export type Scheduler = {
  /** Dispatches `command` after accounting the play time since the last Tick; returns its events. */
  readonly dispatch: (command: Command) => readonly GameEvent[];
  /** Ticks the live time so far, then dispatches `Pause { reason }` (which completes any running beat). */
  readonly pause: (reason: PauseReason) => readonly GameEvent[];
  /** Dispatches `Resume { reason }`; play time runs again once core holds no pause reason. */
  readonly resume: (reason: PauseReason) => readonly GameEvent[];
  /** Core's `AppState.pauseReasons` (the one set, AD-17). */
  readonly pauseReasons: () => ReadonlySet<PauseReason>;
  /** Whether a frame is requested (a beat or a soft-miss cue is running and nothing pauses). */
  readonly running: () => boolean;
  readonly destroy: () => void;
};

/**
 * Creates the scheduler (AD-17): the only reader of the monotonic clock, which it
 * turns into `Tick { elapsedMs }` commands, whole ms with the fractions carried,
 * while core's `pauseReasons` is empty. Paused time is never ticked: the pause set
 * lives in core (`Pause` / `Resume` commands), and the scheduler follows it after
 * every dispatch, restarting its clock when the last reason clears (including
 * the blur-clearing first tap).
 *
 * Choice (documented per the plan): the frame loop runs only while a beat is
 * running (`PlayVM.inputLocked`) or a soft-miss cue is (`PlayVM.softMiss`, which
 * locks nothing but animates), so an idle board costs no frames and no
 * re-renders. Idle play time still counts: it is flushed as one Tick just before
 * every command dispatched through `dispatch` (and before a pause), so a tap's
 * `responseMs` covers the whole wait. Commands must go through `dispatch`, not
 * `game.dispatch`, for that; the scheduler also watches the game, so a beat started
 * any other way still gets its frames.
 */
export function createScheduler(options: SchedulerOptions): Scheduler {
  const { game, now, frames } = options;
  const isPaused = () => game.getState().pauseReasons.length > 0;
  let paused = isPaused();
  let last = now();
  let carry = 0;
  let handle: number | null = null;
  let destroyed = false;

  /** Ticks the play time since the last flush (nothing while paused). */
  function flush(): void {
    if (destroyed || paused) return;
    const t = now();
    const elapsed = t - last + carry;
    last = t;
    if (!(elapsed > 0)) {
      carry = 0;
      return;
    }
    const whole = Math.floor(elapsed);
    carry = elapsed - whole;
    if (whole > 0) game.dispatch({ type: 'Tick', elapsedMs: whole });
  }

  function frame(): void {
    handle = null;
    flush();
    sync();
  }

  function stop(): void {
    if (handle !== null) frames.cancel(handle);
    handle = null;
  }

  /** Follows core's pause set, then requests a frame while a beat or soft-miss cue runs and nothing pauses. */
  function sync(): void {
    if (destroyed) return;
    const nowPaused = isPaused();
    if (nowPaused !== paused) {
      paused = nowPaused;
      if (paused) stop();
      else {
        last = now();
        carry = 0;
      }
    }
    if (paused || handle !== null) return;
    const view = game.getView();
    if (view !== null && (view.inputLocked || view.softMiss !== undefined)) handle = frames.request(frame);
  }

  const unsubscribe = game.subscribe(() => sync());

  function dispatch(command: Command): readonly GameEvent[] {
    flush();
    const events = game.dispatch(command);
    sync();
    return events;
  }

  return {
    dispatch,
    pause: (reason) => dispatch({ type: 'Pause', reason }),
    resume: (reason) => dispatch({ type: 'Resume', reason }),
    pauseReasons: () => new Set(game.getState().pauseReasons),
    running: () => handle !== null,
    destroy() {
      destroyed = true;
      stop();
      unsubscribe();
    },
  };
}

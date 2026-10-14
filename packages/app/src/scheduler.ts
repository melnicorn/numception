import type { Command, GameEvent } from '@numception/core';
import type { Game } from './game';

/**
 * Why play time is paused (AD-17). A set, so sources never cancel each other.
 * Entry 4 adds the lifecycle wiring; `panel`, `gate` and `blur` arrive with their surfaces.
 */
export type PauseReason = 'lifecycle' | 'panel' | 'gate' | 'blur';

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
  readonly pause: (reason: PauseReason) => void;
  readonly resume: (reason: PauseReason) => void;
  readonly pauseReasons: () => ReadonlySet<PauseReason>;
  /** Whether a frame is requested (a beat is running and nothing pauses). */
  readonly running: () => boolean;
  readonly destroy: () => void;
};

/**
 * Creates the scheduler (AD-17): the only reader of the monotonic clock, which it
 * turns into `Tick { elapsedMs }` commands, whole ms with the fractions carried,
 * while `pauseReasons` is empty. Paused time is never ticked.
 *
 * Choice (documented per the plan): the frame loop runs only while a beat is
 * running (`PlayVM.inputLocked`), so an idle board costs no frames and no
 * re-renders. Idle play time still counts: it is flushed as one Tick just before
 * every command dispatched through `dispatch` (and before a pause), so a tap's
 * `responseMs` covers the whole wait. Commands must go through `dispatch`, not
 * `game.dispatch`, for that; the scheduler also watches the game, so a beat started
 * any other way still gets its frames.
 */
export function createScheduler(options: SchedulerOptions): Scheduler {
  const { game, now, frames } = options;
  const pauses = new Set<PauseReason>();
  let last = now();
  let carry = 0;
  let handle: number | null = null;
  let destroyed = false;

  /** Ticks the play time since the last flush (nothing while paused). */
  function flush(): void {
    if (destroyed || pauses.size > 0) return;
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

  /** Requests a frame while a beat runs and nothing pauses. */
  function sync(): void {
    if (destroyed || pauses.size > 0 || handle !== null) return;
    if (game.getView()?.inputLocked === true) handle = frames.request(frame);
  }

  function stop(): void {
    if (handle !== null) frames.cancel(handle);
    handle = null;
  }

  const unsubscribe = game.subscribe(() => sync());

  return {
    dispatch(command) {
      flush();
      const events = game.dispatch(command);
      sync();
      return events;
    },
    pause(reason) {
      if (pauses.size === 0) flush();
      pauses.add(reason);
      stop();
    },
    resume(reason) {
      if (!pauses.delete(reason) || pauses.size > 0) return;
      last = now();
      carry = 0;
      sync();
    },
    pauseReasons: () => new Set(pauses),
    running: () => handle !== null,
    destroy() {
      destroyed = true;
      stop();
      unsubscribe();
    },
  };
}

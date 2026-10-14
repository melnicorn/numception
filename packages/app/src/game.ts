import {
  type AppState,
  type Command,
  type CommandContext,
  type GameEvent,
  hitTestView,
  initialAppState,
  type LayoutPoint,
  type NodeCellRef,
  type PlayVM,
  selectView,
  step,
  type TuningConfig,
} from '@numception/core';
import { isoDates } from './iso-dates';

/** Fresh entropy for one dispatch (AD-22): two ULIDs and two uint32 seeds, e.g. backed by `crypto.getRandomValues`. */
export type EntropySource = () => CommandContext['entropy'];

/** Called synchronously after every dispatch with the new view, the events that produced it, and the command dispatched. */
export type GameListener = (view: PlayVM | null, events: readonly GameEvent[], command: Command) => void;

/** What the composition root injects: the active tuning, the entropy source and the clock (app reads no clock itself). */
export type GameOptions = {
  readonly tuning: TuningConfig;
  readonly entropy: EntropySource;
  readonly now: () => number;
};

/** The store and its synchronous dispatch (AD-2). */
export type Game = {
  /** Builds the envelope, runs `step` then `selectView`, and notifies listeners, all in this call stack. Returns the events. */
  readonly dispatch: (command: Command) => readonly GameEvent[];
  readonly getView: () => PlayVM | null;
  /** The whole state (AD-21), for the save writer and the scheduler's pause reasons. */
  readonly getState: () => AppState;
  /** Adds a listener; returns its removal. */
  readonly subscribe: (listener: GameListener) => () => void;
  /** The cell under `point` (unit-box coordinates) in the current view, or null (see `hitTestView`). */
  readonly hitTest: (point: LayoutPoint, edgeTolerance: number) => NodeCellRef | null;
};

/** Creates the game store, starting from no profiles; dispatch `StartSession` to begin. */
export function createGame(options: GameOptions): Game {
  const { tuning, entropy, now } = options;
  let state: AppState = initialAppState();
  let view: PlayVM | null = selectView(state, tuning);
  const listeners = new Set<GameListener>();

  function context(): CommandContext {
    const nowMs = now();
    return { nowMs, ...isoDates(nowMs), entropy: entropy() };
  }

  return {
    dispatch(command) {
      const result = step(state, { command, ctx: context() }, tuning);
      state = result.state;
      view = selectView(state, tuning);
      for (const listener of [...listeners]) listener(view, result.events, command);
      return result.events;
    },
    getView: () => view,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hitTest: (point, edgeTolerance) => (view === null ? null : hitTestView(view, point, edgeTolerance)),
  };
}

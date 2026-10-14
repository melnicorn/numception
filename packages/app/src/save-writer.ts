import { type AppState, type Command, serializeDeviceSettings, serializeGame } from '@numception/core';
import type { Game } from './game';
import type { StoragePort } from './storage-port';

export type SaveWriterOptions = {
  readonly storage: StoragePort;
  /** The generation of the save that was loaded (0 when none): writes count up from it. */
  readonly generation: number;
  /** Resolves after `ms` (e.g. `setTimeout`): the retry backoff. */
  readonly wait: (ms: number) => Promise<void>;
  /** Told about every failed write (e.g. a dev-only console warning); never shown to players. */
  readonly onError?: (error: unknown) => void;
};

export type SaveWriterStats = {
  /** Snapshots fully written (profile, then device settings). */
  readonly written: number;
  /** Failed write attempts, each retried. */
  readonly failures: number;
  /** A write is in flight, waiting to retry, or pending. */
  readonly busy: boolean;
};

/** The single-flight, latest-wins snapshot writer (AD-10). */
export type SaveWriter = {
  /**
   * Queues `state` for writing; returns at once and never throws. `urgent` (a
   * Pause: the page may be frozen soon) cuts a running retry backoff short, so the
   * write is attempted now; still one write at a time.
   */
  readonly save: (state: AppState, urgent?: boolean) => void;
  /** Resolves once nothing is in flight or pending. */
  readonly settled: () => Promise<void>;
  readonly stats: () => SaveWriterStats;
};

/** First retry delay; it doubles per consecutive failure up to `MAX_BACKOFF_MS`. */
export const FIRST_BACKOFF_MS = 250;
export const MAX_BACKOFF_MS = 30_000;

/**
 * Creates the save writer (AD-10). Single-flight: one write at a time. Latest
 * wins: a snapshot queued while a write is in flight replaces any pending one, so
 * a burst of saves costs at most one more write. Each write is the active
 * profile's snapshot (`serializeGame`, the next generation) and then the
 * `DeviceSettings`, in that order. A failure is retried silently with exponential
 * backoff (the newest snapshot by then, if one was queued), forever; it never
 * blocks play or reaches the UI. An urgent save ends the backoff at once.
 * DeviceSettings is offered every write; the storage skips it when unchanged.
 */
export function createSaveWriter(options: SaveWriterOptions): SaveWriter {
  const { storage, wait, onError } = options;
  let generation = options.generation;
  let pending: AppState | null = null;
  let running = false;
  let written = 0;
  let failures = 0;
  let waiters: (() => void)[] = [];
  /** Ends the current backoff early; null when not backing off. */
  let wake: (() => void) | null = null;

  async function write(state: AppState): Promise<void> {
    const profileId = state.activeProfileId;
    const game = profileId === null ? undefined : state.profiles[profileId];
    if (profileId === null || game === undefined) return;
    generation += 1;
    await storage.saveProfile(profileId, serializeGame(game, generation));
    await storage.saveDevice(serializeDeviceSettings(state.device));
    written += 1;
  }

  async function run(): Promise<void> {
    let streak = 0;
    while (pending !== null) {
      const state = pending;
      pending = null;
      try {
        await write(state);
        streak = 0;
      } catch (error) {
        failures += 1;
        onError?.(error);
        if (pending === null) pending = state;
        const delay = Math.min(MAX_BACKOFF_MS, FIRST_BACKOFF_MS * 2 ** streak);
        streak += 1;
        await new Promise<void>((resolve) => {
          wake = resolve;
          void wait(delay).then(resolve);
        });
        wake = null;
      }
    }
    running = false;
    const done = waiters;
    waiters = [];
    for (const resolve of done) resolve();
  }

  return {
    save(state, urgent = false) {
      pending = state;
      if (urgent) wake?.();
      if (running) return;
      running = true;
      void run();
    },
    settled: () => (running ? new Promise<void>((resolve) => waiters.push(resolve)) : Promise.resolve()),
    stats: () => ({ written, failures, busy: running }),
  };
}

/**
 * Saves `game` through `writer` at the end of every batch (AD-10): the commands
 * dispatched in one macrotask. A batch is saved when it contains any non-`Tick`
 * command; `defer` (e.g. `setTimeout(fn, 0)`) runs the save after the batch. A
 * `Pause` saves at once and urgently instead (cutting any retry backoff short), so
 * the write starts before a backgrounded page is frozen. Returns the unsubscribe.
 */
export function saveAfterBatches(game: Game, writer: SaveWriter, defer: (fn: () => void) => void): () => void {
  let scheduled = false;
  return game.subscribe((_view, _events, command: Command) => {
    if (command.type === 'Tick') return;
    if (command.type === 'Pause') {
      writer.save(game.getState(), true);
      return;
    }
    if (scheduled) return;
    scheduled = true;
    defer(() => {
      scheduled = false;
      writer.save(game.getState());
    });
  });
}

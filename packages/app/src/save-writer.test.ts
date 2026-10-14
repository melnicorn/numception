import { type AppState, type CommandContext, initialAppState, parseTuning, step } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { createGame } from './game';
import { loadSave } from './load-save';
import { createSaveWriter, saveAfterBatches } from './save-writer';
import { createSlotStorage, slotKey } from './slot-storage';
import type { DeviceLoad, ProfileLoad, StorageDriver, StoragePort, StoreName } from './storage-port';

const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add'],
    n: { min: 3, max: 3 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

function ctx(i: number): CommandContext {
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`p${i}`, `r${i}`], seed32: [500 + i, i] } };
}

/** A started session, then `ticks` idle Ticks of 10 ms: distinct states with growing clockMs. */
function states(ticks: number): AppState[] {
  let state = step(initialAppState(), { command: { type: 'StartSession' }, ctx: ctx(0) }, tuning).state;
  const out = [state];
  for (let i = 1; i <= ticks; i += 1) {
    state = step(state, { command: { type: 'Tick', elapsedMs: 10 }, ctx: ctx(i) }, tuning).state;
    out.push(state);
  }
  return out;
}

const clockOf = (state: AppState) => state.profiles[state.activeProfileId ?? '']?.clockMs;

/** Flushes pending promise callbacks. */
const drain = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

/** A memory driver whose writes can be held, failed, or torn (a crash after a partial write). */
function faultyDriver() {
  const data: Record<StoreName, Map<string, string>> = { device: new Map(), profiles: new Map() };
  const log: string[] = [];
  let hold: Promise<void> | null = null;
  let failNext = 0;
  let tearNext = false;
  const driver: StorageDriver = {
    read: async (store, keys) => keys.map((k) => data[store].get(k)),
    async write(store, key, value) {
      log.push(`${store}:${key}`);
      if (hold !== null) await hold;
      if (tearNext) {
        tearNext = false;
        data[store].set(key, value.slice(0, Math.floor(value.length / 2)));
        throw new Error('killed mid-write');
      }
      if (failNext > 0) {
        failNext -= 1;
        throw new Error('disk full');
      }
      data[store].set(key, value);
    },
    readAll: async () => ({ device: new Map(data.device), profiles: new Map(data.profiles) }),
  };
  return {
    data,
    driver,
    log,
    holdWrites() {
      let release = () => {};
      hold = new Promise<void>((r) => {
        release = () => {
          hold = null;
          r();
        };
      });
      return () => release();
    },
    fail(n: number) {
      failNext = n;
    },
    tear() {
      tearNext = true;
    },
  };
}

describe('createSaveWriter', () => {
  it('writes the profile snapshot, then the device settings (only when changed), with rising generations', async () => {
    const f = faultyDriver();
    const writer = createSaveWriter({ storage: createSlotStorage(f.driver), generation: 4, wait: async () => {} });
    const [s0, s1] = states(1) as [AppState, AppState];
    writer.save(s0);
    await writer.settled();
    writer.save(s1);
    await writer.settled();
    expect(f.log).toEqual(['profiles:p0:A', 'device:device', 'profiles:p0:B']);
    expect(JSON.parse(f.data.profiles.get('p0:A') ?? '').generation).toBe(5);
    expect(JSON.parse(f.data.profiles.get('p0:B') ?? '').generation).toBe(6);
    expect(JSON.parse(f.data.device.get('device') ?? '')).toEqual({ kind: 'DeviceSettings', schemaVersion: 1, activeProfileId: 'p0' });
    expect(writer.stats()).toEqual({ written: 2, failures: 0, busy: false });
  });

  it('is single-flight and latest-wins: saves during a write replace the pending one', async () => {
    const f = faultyDriver();
    const storage = createSlotStorage(f.driver);
    const writer = createSaveWriter({ storage, generation: 0, wait: async () => {} });
    const all = states(4);
    const release = f.holdWrites();
    writer.save(all[0] as AppState);
    await drain();
    for (const s of all.slice(1)) writer.save(s);
    expect(f.log).toEqual(['profiles:p0:A']);
    release();
    await writer.settled();
    expect(f.log).toEqual(['profiles:p0:A', 'device:device', 'profiles:p0:B']);
    const loaded = await createSlotStorage(f.driver).loadProfile('p0');
    expect(loaded.status === 'loaded' && loaded.game.clockMs).toBe(clockOf(all[4] as AppState));
  });

  it('retries a failed write silently with exponential backoff, and play is never blocked', async () => {
    const f = faultyDriver();
    const waits: number[] = [];
    const errors: unknown[] = [];
    const writer = createSaveWriter({
      storage: createSlotStorage(f.driver),
      generation: 0,
      wait: async (ms) => {
        waits.push(ms);
      },
      onError: (e) => errors.push(e),
    });
    f.fail(3);
    const [s0] = states(0) as [AppState];
    expect(() => writer.save(s0)).not.toThrow();
    await writer.settled();
    expect(waits).toEqual([250, 500, 1000]);
    expect(errors).toHaveLength(3);
    expect(writer.stats()).toMatchObject({ written: 1, failures: 3, busy: false });
    expect(await createSlotStorage(f.driver).loadProfile('p0')).toMatchObject({ status: 'loaded' });
  });

  it('retries with the newest snapshot when one was queued during the failed write', async () => {
    const f = faultyDriver();
    const storage = createSlotStorage(f.driver);
    let unblock = () => {};
    const writer = createSaveWriter({ storage, generation: 0, wait: () => new Promise<void>((r) => (unblock = r)) });
    const [s0, s1] = states(1) as [AppState, AppState];
    f.fail(1);
    writer.save(s0);
    await drain();
    writer.save(s1);
    unblock();
    await writer.settled();
    const loaded = await createSlotStorage(f.driver).loadProfile('p0');
    expect(loaded.status === 'loaded' && loaded.game.clockMs).toBe(clockOf(s1));
  });

  it('an urgent save (Pause) cuts a retry backoff short and writes at once, still one write at a time', async () => {
    const f = faultyDriver();
    const waits: number[] = [];
    // The backoff never ends by itself: only the urgent save can end it.
    const writer = createSaveWriter({ storage: createSlotStorage(f.driver), generation: 0, wait: (ms) => (waits.push(ms), new Promise<void>(() => {})) });
    const [s0, s1, s2] = states(2) as [AppState, AppState, AppState];
    f.fail(1);
    writer.save(s0);
    await drain();
    expect(waits).toEqual([250]);
    writer.save(s1);
    await drain();
    expect(writer.stats()).toMatchObject({ written: 0, busy: true });
    writer.save(s2, true);
    await writer.settled();
    expect(writer.stats()).toMatchObject({ written: 1, failures: 1, busy: false });
    const loaded = await createSlotStorage(f.driver).loadProfile('p0');
    expect(loaded.status === 'loaded' && loaded.game.clockMs).toBe(clockOf(s2));
  });

  it('kill mid-write of the device record: boot derives the profile from the snapshots and restores it', async () => {
    const f = faultyDriver();
    const writer = createSaveWriter({ storage: createSlotStorage(f.driver), generation: 0, wait: () => new Promise<void>(() => {}) });
    const [s0, s1] = states(1) as [AppState, AppState];
    writer.save(s0);
    await writer.settled();
    writer.save(s1);
    await writer.settled();
    // A device record torn mid-write (e.g. by another write of it after a profile change).
    f.data.device.set('device', '{"kind":"DeviceSet');
    const torn = await loadSave(createSlotStorage(f.driver), () => new Promise<void>(() => {}), 1000);
    expect(torn).toEqual({ restore: s1.profiles.p0, generation: 2, writable: true });

    // The very first device write killed after its profile snapshot landed.
    const g = faultyDriver();
    const tearing: StorageDriver = {
      ...g.driver,
      write: async (store, key, value) => {
        if (store !== 'device') return g.driver.write(store, key, value);
        g.data.device.set(key, value.slice(0, 10));
        throw new Error('killed mid-write');
      },
    };
    const firstWriter = createSaveWriter({ storage: createSlotStorage(tearing), generation: 0, wait: () => new Promise<void>(() => {}) });
    firstWriter.save(s0);
    await drain();
    expect(g.data.profiles.has(slotKey('p0', 'A'))).toBe(true);
    expect(g.data.device.get('device')).toHaveLength(10);
    const relaunch = await loadSave(createSlotStorage(g.driver), () => new Promise<void>(() => {}), 1000);
    expect(relaunch).toEqual({ restore: s0.profiles.p0, generation: 1, writable: true });
  });

  it('kill mid-write: a crash after a partial slot write reloads the last good state', async () => {
    const f = faultyDriver();
    const writer = createSaveWriter({ storage: createSlotStorage(f.driver), generation: 0, wait: () => new Promise<void>(() => {}) });
    const [s0, s1, s2] = states(2) as [AppState, AppState, AppState];
    writer.save(s0);
    await writer.settled();
    writer.save(s1);
    await writer.settled();
    // The process dies halfway through writing s2 into slot A (the older one).
    f.tear();
    writer.save(s2);
    await drain();
    expect(f.data.profiles.get(slotKey('p0', 'A'))?.length).toBeGreaterThan(0);

    // Relaunch over whatever the crash left behind.
    const session = await loadSave(createSlotStorage(f.driver), () => new Promise<void>(() => {}), 1000);
    expect(session.writable).toBe(true);
    expect(session.restore?.clockMs).toBe(clockOf(s1));
    expect(session.generation).toBe(2);

    // The next save after relaunch overwrites the torn slot, not the good one.
    const after = createSaveWriter({ storage: createSlotStorage(f.driver), generation: session.generation, wait: async () => {} });
    after.save(s2);
    await after.settled();
    expect(JSON.parse(f.data.profiles.get(slotKey('p0', 'A')) ?? '').generation).toBe(3);
    expect(JSON.parse(f.data.profiles.get(slotKey('p0', 'B')) ?? '').generation).toBe(2);
  });
});

describe('saveAfterBatches', () => {
  it('saves once per batch containing a non-Tick command, never for Ticks alone, and at once on Pause', async () => {
    const game = createGame({ tuning, entropy: (() => { let i = 0; return () => ctx(++i).entropy; })(), now: () => 0 });
    const saved: AppState[] = [];
    const writer = { save: (s: AppState) => saved.push(s), settled: async () => {}, stats: () => ({ written: 0, failures: 0, busy: false }) };
    const deferred: (() => void)[] = [];
    saveAfterBatches(game, writer, (fn) => deferred.push(fn));
    game.dispatch({ type: 'StartSession' });
    game.dispatch({ type: 'Tick', elapsedMs: 5 });
    game.dispatch({ type: 'ZoomOut' });
    expect(deferred).toHaveLength(1);
    expect(saved).toHaveLength(0);
    deferred.shift()?.();
    expect(saved).toEqual([game.getState()]);
    game.dispatch({ type: 'Tick', elapsedMs: 5 });
    expect(deferred).toHaveLength(0);
    game.dispatch({ type: 'Pause', reason: 'lifecycle' });
    expect(saved).toHaveLength(2);
    expect(saved[1]?.pauseReasons).toEqual(['blur', 'lifecycle']);
  });
});

describe('loadSave', () => {
  const never = () => new Promise<void>(() => {});
  const inMemory = { restore: null, generation: 0, writable: false };
  const game = states(0)[0]?.profiles.p0;
  if (game === undefined) throw new Error('no game');

  function storageWith(device: DeviceLoad, profiles: [string, ProfileLoad][], overrides: Partial<StoragePort> = {}): StoragePort {
    return {
      loadAll: async () => ({ device, profiles: new Map(profiles) }),
      loadDevice: async () => device,
      loadProfile: async () => ({ status: 'empty' }),
      saveProfile: async () => {},
      saveDevice: async () => {},
      ...overrides,
    };
  }
  const pointsTo = (id: string): DeviceLoad => ({ status: 'loaded', device: { activeProfileId: id } });

  it('restores the active profile, and starts fresh and writable with nothing saved or a corrupt profile', async () => {
    expect(await loadSave(storageWith(pointsTo('p'), [['p', { status: 'loaded', game, generation: 3 }]]), never, 1000)).toEqual({ restore: game, generation: 3, writable: true });
    expect(await loadSave(storageWith({ status: 'empty' }, []), never, 1000)).toEqual({ restore: null, generation: 0, writable: true });
    expect(await loadSave(storageWith(pointsTo('p'), [['p', { status: 'corrupt' }]]), never, 1000)).toEqual({ restore: null, generation: 0, writable: true });
  });

  it('with the device record missing or corrupt, restores the profile with the highest valid generation', async () => {
    const profiles: [string, ProfileLoad][] = [
      ['a', { status: 'loaded', game: { ...game, clockMs: 1 }, generation: 2 }],
      ['b', { status: 'loaded', game, generation: 9 }],
      ['c', { status: 'corrupt' }],
    ];
    expect(await loadSave(storageWith({ status: 'corrupt' }, profiles), never, 1000)).toEqual({ restore: game, generation: 9, writable: true });
    expect(await loadSave(storageWith({ status: 'empty' }, profiles), never, 1000)).toEqual({ restore: game, generation: 9, writable: true });
    expect(await loadSave(storageWith({ status: 'empty' }, [...profiles, ['d', { status: 'too-new' }]]), never, 1000)).toEqual(inMemory);
  });

  it('plays in memory without writing when a save is too new, the read fails, or it times out', async () => {
    expect(await loadSave(storageWith(pointsTo('p'), [['p', { status: 'too-new' }]]), never, 1000)).toEqual(inMemory);
    expect(await loadSave(storageWith({ status: 'too-new' }, []), never, 1000)).toEqual(inMemory);
    expect(await loadSave(storageWith({ status: 'empty' }, [], { loadAll: () => Promise.reject(new Error('no idb')) }), never, 1000)).toEqual(inMemory);
    expect(await loadSave(storageWith({ status: 'empty' }, [], { loadAll: () => new Promise(() => {}) }), async () => {}, 1000)).toEqual(inMemory);
  });
});

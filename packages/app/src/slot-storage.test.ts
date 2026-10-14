import { type CommandContext, type GameState, initialAppState, parseTuning, serializeDeviceSettings, serializeGame, step } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { createSlotStorage, DEVICE_KEY, slotKey } from './slot-storage';
import type { StorageDriver, StoreName } from './storage-port';

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

const ctx: CommandContext = { nowMs: 0, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: ['p1', 'r1'], seed32: [99, 1] } };

function aGame(clockMs: number): GameState {
  const state = step(initialAppState(), { command: { type: 'StartSession' }, ctx }, tuning).state;
  return { ...(state.profiles.p1 as GameState), clockMs };
}

/** An in-memory driver: a map per store. */
function memoryDriver() {
  const data: Record<StoreName, Map<string, string>> = { device: new Map(), profiles: new Map() };
  const driver: StorageDriver = {
    read: async (store, keys) => keys.map((k) => data[store].get(k)),
    write: async (store, key, value) => {
      data[store].set(key, value);
    },
    readAll: async () => ({ device: new Map(data.device), profiles: new Map(data.profiles) }),
  };
  return { data, driver };
}

describe('createSlotStorage', () => {
  it('alternates A/B slots and loads the highest generation', async () => {
    const { data, driver } = memoryDriver();
    const storage = createSlotStorage(driver);
    expect(await storage.loadProfile('p1')).toEqual({ status: 'empty' });
    await storage.saveProfile('p1', serializeGame(aGame(1), 1));
    await storage.saveProfile('p1', serializeGame(aGame(2), 2));
    await storage.saveProfile('p1', serializeGame(aGame(3), 3));
    expect(JSON.parse(data.profiles.get(slotKey('p1', 'A')) ?? '').generation).toBe(3);
    expect(JSON.parse(data.profiles.get(slotKey('p1', 'B')) ?? '').generation).toBe(2);
    const fresh = createSlotStorage(driver);
    expect(await fresh.loadProfile('p1')).toEqual({ status: 'loaded', game: aGame(3), generation: 3 });
  });

  it('writes the lower slot of an existing save even before any load, never the latest good one', async () => {
    const { data, driver } = memoryDriver();
    data.profiles.set(slotKey('p1', 'A'), JSON.stringify(serializeGame(aGame(1), 4)));
    data.profiles.set(slotKey('p1', 'B'), JSON.stringify(serializeGame(aGame(2), 5)));
    await createSlotStorage(driver).saveProfile('p1', serializeGame(aGame(3), 6));
    expect(JSON.parse(data.profiles.get(slotKey('p1', 'A')) ?? '').generation).toBe(6);
    expect(JSON.parse(data.profiles.get(slotKey('p1', 'B')) ?? '').generation).toBe(5);
  });

  it('falls back to the other slot when the latest one is torn or fails its checksum', async () => {
    const { data, driver } = memoryDriver();
    const storage = createSlotStorage(driver);
    await storage.saveProfile('p1', serializeGame(aGame(1), 1));
    await storage.saveProfile('p1', serializeGame(aGame(2), 2));
    const latest = data.profiles.get(slotKey('p1', 'B')) ?? '';
    data.profiles.set(slotKey('p1', 'B'), latest.slice(0, latest.length - 40));
    expect(await createSlotStorage(driver).loadProfile('p1')).toEqual({ status: 'loaded', game: aGame(1), generation: 1 });
    data.profiles.set(slotKey('p1', 'B'), latest.replace('"clockMs":2', '"clockMs":7'));
    expect(await createSlotStorage(driver).loadProfile('p1')).toEqual({ status: 'loaded', game: aGame(1), generation: 1 });
  });

  it('reports corrupt when no slot is valid, and leaves the data untouched', async () => {
    const { data, driver } = memoryDriver();
    data.profiles.set(slotKey('p1', 'A'), '{"kind":"GameSave"');
    data.profiles.set(slotKey('p1', 'B'), 'garbage');
    expect(await createSlotStorage(driver).loadProfile('p1')).toEqual({ status: 'corrupt' });
    expect([...data.profiles.values()]).toEqual(['{"kind":"GameSave"', 'garbage']);
  });

  it('reports too-new when any slot was written by a newer build', async () => {
    const { data, driver } = memoryDriver();
    data.profiles.set(slotKey('p1', 'A'), JSON.stringify(serializeGame(aGame(1), 1)));
    data.profiles.set(slotKey('p1', 'B'), JSON.stringify({ ...serializeGame(aGame(2), 2), saveFormatVersion: 99 }));
    expect(await createSlotStorage(driver).loadProfile('p1')).toEqual({ status: 'too-new' });
  });

  it('loadAll reads the device record and every profile in one call, and seeds the slot cache', async () => {
    const { data, driver } = memoryDriver();
    data.profiles.set(slotKey('p1', 'A'), JSON.stringify(serializeGame(aGame(1), 4)));
    data.profiles.set(slotKey('p1', 'B'), JSON.stringify(serializeGame(aGame(2), 5)));
    data.profiles.set(slotKey('p2', 'A'), 'torn');
    data.device.set(DEVICE_KEY, JSON.stringify(serializeDeviceSettings({ activeProfileId: 'p1' })));
    const storage = createSlotStorage(driver);
    const all = await storage.loadAll();
    expect(all.device).toEqual({ status: 'loaded', device: { activeProfileId: 'p1' } });
    expect(all.profiles).toEqual(new Map([['p1', { status: 'loaded', game: aGame(2), generation: 5 }], ['p2', { status: 'corrupt' }]]));
    await storage.saveProfile('p1', serializeGame(aGame(3), 6));
    expect(JSON.parse(data.profiles.get(slotKey('p1', 'A')) ?? '').generation).toBe(6);
  });

  it('rewrites the device settings only when they change', async () => {
    const writes: string[] = [];
    const { driver } = memoryDriver();
    const storage = createSlotStorage({ ...driver, write: async (store, key, value) => (writes.push(key), driver.write(store, key, value)) });
    await storage.saveDevice(serializeDeviceSettings({ activeProfileId: 'p1' }));
    await storage.saveDevice(serializeDeviceSettings({ activeProfileId: 'p1' }));
    await storage.saveDevice(serializeDeviceSettings({ activeProfileId: 'p2' }));
    expect(writes).toEqual([DEVICE_KEY, DEVICE_KEY]);
  });

  it('saves and loads the device settings, and classifies bad ones', async () => {
    const { data, driver } = memoryDriver();
    const storage = createSlotStorage(driver);
    expect(await storage.loadDevice()).toEqual({ status: 'empty' });
    await storage.saveDevice(serializeDeviceSettings({ activeProfileId: 'p1' }));
    expect(await storage.loadDevice()).toEqual({ status: 'loaded', device: { activeProfileId: 'p1' } });
    data.device.set(DEVICE_KEY, '{"kind":"DeviceSettings","schemaVersion":2,"activeProfileId":"p1"}');
    expect(await storage.loadDevice()).toEqual({ status: 'too-new' });
    data.device.set(DEVICE_KEY, '{');
    expect(await storage.loadDevice()).toEqual({ status: 'corrupt' });
  });
});

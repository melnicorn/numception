import { type DomainError, type ParsedSave, parseDeviceSettings, parseSave, type Result } from '@numception/core';
import type { DeviceLoad, ProfileLoad, StorageDriver, StoragePort } from './storage-port';

/** The device settings key in the `device` store. */
export const DEVICE_KEY = 'device';

const SLOTS = ['A', 'B'] as const;
type Slot = (typeof SLOTS)[number];

/** The `profiles` store key of `profileId`'s `slot`. */
export function slotKey(profileId: string, slot: Slot): string {
  return `${profileId}:${slot}`;
}

/** A slot's generation as last read or written; -1 for absent, invalid or possibly torn. */
type SlotGenerations = Record<Slot, number>;

type Parsed = Result<ParsedSave, DomainError> | undefined;

function generationOf(parsed: Parsed): number {
  return parsed !== undefined && parsed.ok ? parsed.value.generation : -1;
}

function deviceLoad(text: string | undefined): DeviceLoad {
  if (text === undefined) return { status: 'empty' };
  const parsed = parseDeviceSettings(text);
  if (parsed.ok) return { status: 'loaded', device: parsed.value };
  return { status: parsed.error.code === 'save-too-new' ? 'too-new' : 'corrupt' };
}

/** The profile's load from its two slots: too-new if either is, else the highest valid generation. */
function profileLoad(raw: readonly (string | undefined)[], parsed: readonly Parsed[]): ProfileLoad {
  if (parsed.some((p) => p !== undefined && !p.ok && p.error.code === 'save-too-new')) return { status: 'too-new' };
  let best: ProfileLoad = { status: raw.some((text) => text !== undefined) ? 'corrupt' : 'empty' };
  for (const p of parsed) {
    if (p === undefined || !p.ok) continue;
    if (best.status !== 'loaded' || p.value.generation > best.generation) {
      best = { status: 'loaded', game: p.value.game, generation: p.value.generation };
    }
  }
  return best;
}

/**
 * The `StoragePort` over `driver` with A/B snapshot slots (AD-10):
 *
 * - **Load** reads both slots of a profile together and picks the
 *   highest-generation one that parses and passes its checksum (`parseSave`), so a
 *   torn write in one slot leaves the other good. Any slot from a newer build makes
 *   the profile `too-new`. `loadAll` reads the device record and every profile's
 *   slots in one driver call (one IndexedDB transaction).
 * - **Save** writes the slot with the lower generation (absent, invalid or torn
 *   counts as lowest; A on a tie), never the one holding the latest good save.
 *   Slot generations are cached from the last load or write; a profile not loaded
 *   yet has its slots read first. A failed write marks its slot torn, so the retry
 *   goes to the same slot.
 * - **DeviceSettings** is rewritten only when its text changed from what was last
 *   read or written, so a kill rarely lands in its single record.
 */
export function createSlotStorage(driver: StorageDriver): StoragePort {
  const known = new Map<string, SlotGenerations>();
  /** The device record's text as last read or written; undefined when unknown (or a write failed). */
  let deviceText: string | undefined;

  function remember(profileId: string, parsed: readonly Parsed[]): void {
    known.set(profileId, { A: generationOf(parsed[0]), B: generationOf(parsed[1]) });
  }

  async function readSlots(profileId: string) {
    const raw = await driver.read('profiles', SLOTS.map((slot) => slotKey(profileId, slot)));
    const parsed = raw.map((text) => (text === undefined ? undefined : parseSave(text)));
    remember(profileId, parsed);
    return { raw, parsed };
  }

  return {
    async loadAll() {
      const all = await driver.readAll();
      const deviceRaw = all.device.get(DEVICE_KEY);
      const device = deviceLoad(deviceRaw);
      if (device.status === 'loaded') deviceText = deviceRaw;
      const ids = new Set<string>();
      for (const key of all.profiles.keys()) {
        const match = /^(.*):[AB]$/.exec(key);
        if (match?.[1] !== undefined) ids.add(match[1]);
      }
      const profiles = new Map<string, ProfileLoad>();
      for (const id of ids) {
        const raw = SLOTS.map((slot) => all.profiles.get(slotKey(id, slot)));
        const parsed = raw.map((text) => (text === undefined ? undefined : parseSave(text)));
        remember(id, parsed);
        profiles.set(id, profileLoad(raw, parsed));
      }
      return { device, profiles };
    },
    async loadDevice(): Promise<DeviceLoad> {
      const [text] = await driver.read('device', [DEVICE_KEY]);
      const device = deviceLoad(text);
      if (device.status === 'loaded') deviceText = text;
      return device;
    },
    async loadProfile(profileId): Promise<ProfileLoad> {
      const { raw, parsed } = await readSlots(profileId);
      return profileLoad(raw, parsed);
    },
    async saveProfile(profileId, doc) {
      const generations = known.get(profileId) ?? (await readSlots(profileId), known.get(profileId));
      const gens: SlotGenerations = generations ?? { A: -1, B: -1 };
      const slot: Slot = gens.B < gens.A ? 'B' : 'A';
      const next: SlotGenerations = { ...gens, [slot]: -1 };
      known.set(profileId, next);
      await driver.write('profiles', slotKey(profileId, slot), JSON.stringify(doc));
      known.set(profileId, { ...next, [slot]: doc.generation });
    },
    async saveDevice(doc) {
      const text = JSON.stringify(doc);
      if (text === deviceText) return;
      deviceText = undefined;
      await driver.write('device', DEVICE_KEY, text);
      deviceText = text;
    },
  };
}

import type { FeedbackFlags } from '@numception/app';

/** The parts of `localStorage` the legacy reader uses. */
export type LegacyFlagStorage = Pick<Storage, 'getItem' | 'removeItem'>;

/**
 * The dev feedback flags tickets 6.2 and 6.3 kept in localStorage
 * (`numception:feedback-flags:<appId>`), taken once so the client can move them
 * into the profile's settings (`SetSetting`): the boolean fields stored, and the
 * key is removed. Null when nothing (or nothing readable) was stored; malformed
 * fields are left out. Never throws.
 */
export function takeLegacyFeedbackFlags(
  appId: string,
  storage: () => LegacyFlagStorage | null = () => globalThis.localStorage ?? null,
): Partial<FeedbackFlags> | null {
  const key = `numception:feedback-flags:${appId}`;
  try {
    const store = storage();
    const text = store?.getItem(key);
    if (store == null || text == null) return null;
    store.removeItem(key);
    const value: unknown = JSON.parse(text);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    const flags: { -readonly [K in keyof FeedbackFlags]?: boolean } = {};
    for (const k of ['effects', 'music', 'haptics'] as const) if (typeof record[k] === 'boolean') flags[k] = record[k] as boolean;
    return flags;
  } catch {
    return null;
  }
}

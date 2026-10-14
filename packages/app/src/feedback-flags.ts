/**
 * The feedback switches the director is gated by. For now dev flags, set in the dev
 * panel and stored per device by a platform adapter; entry 4 moves them into the
 * per-profile settings (AD-21: effects, music, haptics) behind `SetSetting`
 * commands, and this module (with `FeedbackFlagStore`) is what that move replaces.
 * The three are independent: `haptics` gates the haptic taps only, never a sound.
 */
export type FeedbackFlags = { readonly effects: boolean; readonly music: boolean; readonly haptics: boolean };

/** Effects and haptics on, music off (there is no music yet). */
export const DEFAULT_FEEDBACK_FLAGS: FeedbackFlags = Object.freeze({ effects: true, music: false, haptics: true });

/** Where the flags persist (a platform adapter, e.g. localStorage). Never throws. */
export type FeedbackFlagStore = {
  readonly read: () => FeedbackFlags;
  readonly write: (flags: FeedbackFlags) => void;
};

/** What the dev panel reads and sets. */
export type FeedbackControls = {
  readonly get: () => FeedbackFlags;
  readonly set: (flags: FeedbackFlags) => void;
};

/** `value` as flags, each missing or malformed field taking its default (flags stored before haptics read as haptics on). */
export function parseFeedbackFlags(value: unknown): FeedbackFlags {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const flag = (key: keyof FeedbackFlags) => (typeof record[key] === 'boolean' ? (record[key] as boolean) : DEFAULT_FEEDBACK_FLAGS[key]);
  return { effects: flag('effects'), music: flag('music'), haptics: flag('haptics') };
}

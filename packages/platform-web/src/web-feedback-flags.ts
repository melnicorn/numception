import { type FeedbackFlags, type FeedbackFlagStore, parseFeedbackFlags } from '@numception/app';

/** The parts of `localStorage` the flag store uses. */
export type FeedbackFlagStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * The dev feedback flags (effects, music, haptics) in localStorage, one key per flavour
 * `appId`. Dev flags only: entry 4 moves them into the profile settings. Missing,
 * malformed or unreadable storage reads as the defaults; a failed write is dropped.
 */
export function webFeedbackFlags(appId: string, storage: () => FeedbackFlagStorage | null = () => globalThis.localStorage ?? null): FeedbackFlagStore {
  const key = `numception:feedback-flags:${appId}`;
  return {
    read(): FeedbackFlags {
      try {
        const text = storage()?.getItem(key);
        return parseFeedbackFlags(text == null ? null : JSON.parse(text));
      } catch {
        return parseFeedbackFlags(null);
      }
    },
    write(flags) {
      try {
        storage()?.setItem(key, JSON.stringify({ effects: flags.effects, music: flags.music, haptics: flags.haptics }));
      } catch {
        // Private mode or quota: the flags last this session only.
      }
    },
  };
}

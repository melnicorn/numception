/**
 * The sound cues (FR-41): what the feedback director asks the audio adapter to play.
 *
 * - `solve`: a puzzle was solved; `params.step` is how many scale steps below the
 *   top note it sounds (tier 1 is step 0, one step lower per tier).
 * - `softMiss`: a soft click (the − soft miss, FR-4).
 * - `wrongZen`: a soft low tone for a wrong tap in Zen.
 * - `whoosh`: the round change (the theme change into the next round).
 */
export type CueId = 'solve' | 'softMiss' | 'wrongZen' | 'whoosh';

/** Per-call cue parameters. `step` (solve only): scale steps down from the top note, an integer >= 0. */
export type CueParams = { readonly step?: number };

/** Which audio channels are on. Music has no content yet: its channel plays nothing. */
export type AudioChannels = { readonly effects: boolean; readonly music: boolean };

/**
 * The audio port (AD-16). Adapters never throw and degrade silently: before
 * `unlock` (the first user gesture), while suspended, with effects off, or with no
 * audio API at all, `play` does nothing.
 */
export type AudioPort = {
  /** Called from a user gesture: creates or resumes the audio output. Idempotent. */
  readonly unlock: () => void;
  readonly play: (cue: CueId, params?: CueParams) => void;
  readonly setEnabled: (channels: AudioChannels) => void;
  /** The app went to the background: stop all output. */
  readonly suspend: () => void;
  /** The app came back. */
  readonly resume: () => void;
};

/** The no-op audio adapter (AD-16: every feature works without sound). */
export const noAudio: AudioPort = Object.freeze({
  unlock: () => {},
  play: () => {},
  setEnabled: () => {},
  suspend: () => {},
  resume: () => {},
});

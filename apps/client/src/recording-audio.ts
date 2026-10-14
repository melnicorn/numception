import type { AudioPort, CueId, CueParams } from '@numception/app';

/** One `play` the feedback director made. */
export type CueCall = { readonly cue: CueId; readonly params?: CueParams };

/**
 * Wraps `inner` so every `play` is also appended to `log` (dev and playtest only:
 * the e2e specs read it through the test hook, since headless browsers have no
 * audible output to check).
 */
export function recordingAudio(inner: AudioPort, log: CueCall[]): AudioPort {
  return {
    ...inner,
    play(cue, params) {
      log.push(params === undefined ? { cue } : { cue, params: { ...params } });
      inner.play(cue, params);
    },
  };
}

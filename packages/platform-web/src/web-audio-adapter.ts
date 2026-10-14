import type { AudioChannels, AudioPort, CueId, CueParams } from '@numception/app';

/** The parts of an `AudioContext` the adapter uses (a fake one in tests). */
export type WebAudioContext = Pick<
  AudioContext,
  | 'currentTime'
  | 'sampleRate'
  | 'destination'
  | 'state'
  | 'createGain'
  | 'createOscillator'
  | 'createBiquadFilter'
  | 'createBuffer'
  | 'createBufferSource'
  | 'resume'
  | 'suspend'
>;

/** `navigator.audioSession` (Safari 16.4+), where it exists. */
export type AudioSessionLike = { type: string };

export type WebAudioOptions = {
  /** Creates the context on the first `unlock`; null when there is no Web Audio. Defaults to `AudioContext`. */
  readonly createContext?: () => WebAudioContext | null;
  /** Defaults to `navigator.audioSession`. */
  readonly audioSession?: AudioSessionLike | null;
  /** Noise samples for the whoosh, in [0, 1). Defaults to `Math.random` (sound only, never game state). */
  readonly random?: () => number;
};

/**
 * The solve notes (FR-41): the C major pentatonic, descending from E5. Tier 1
 * sounds step 0 (E5), tier 2 step 1 (D5), tier 3 step 2 (C5), and so on; past
 * the end it holds the lowest note.
 */
export const SOLVE_SCALE_HZ: readonly number[] = [659.26, 587.33, 523.25, 440.0, 392.0, 329.63, 293.66, 261.63];

/** The master gain: modest, so every cue at its peak, even several overlapping, stays well below clipping. */
export const MASTER_GAIN = 0.3;

/** An oscillator cue: a gain envelope (linear attack, exponential release) over one wave. */
export type ToneCue = {
  readonly kind: 'tone';
  readonly wave: OscillatorType;
  /** Fixed pitch, or `'scale'`: `SOLVE_SCALE_HZ[params.step]`. */
  readonly hz: number | 'scale';
  readonly peak: number;
  readonly attackS: number;
  readonly durationS: number;
};

/** A filtered-noise cue, its filter frequency swept from `fromHz` to `toHz`. */
export type NoiseCue = {
  readonly kind: 'noise';
  readonly filter: BiquadFilterType;
  readonly fromHz: number;
  readonly toHz: number;
  readonly q: number;
  readonly peak: number;
  readonly attackS: number;
  readonly durationS: number;
};

/** Every cue's sound, in one table to retune (peaks are before `MASTER_GAIN`; all <= 1). */
export const CUES: Readonly<Record<CueId, ToneCue | NoiseCue>> = {
  // A short soft sine, gently in and out.
  solve: { kind: 'tone', wave: 'sine', hz: 'scale', peak: 0.6, attackS: 0.015, durationS: 0.18 },
  // A soft click: a very short band of noise.
  softMiss: { kind: 'noise', filter: 'bandpass', fromHz: 2200, toHz: 1600, q: 2, peak: 0.5, attackS: 0.002, durationS: 0.04 },
  // A soft low tone (G3).
  wrongZen: { kind: 'tone', wave: 'triangle', hz: 196.0, peak: 0.45, attackS: 0.02, durationS: 0.24 },
  // The round change: noise through a band-pass sweeping up.
  whoosh: { kind: 'noise', filter: 'bandpass', fromHz: 300, toHz: 2400, q: 1.2, peak: 0.5, attackS: 0.15, durationS: 0.6 },
};

/** Silence floor for exponential ramps (they cannot reach 0). */
const FLOOR = 0.0001;
/** Each source stops this long after its envelope ends. */
const TAIL_S = 0.02;
/** Length of the shared noise buffer. */
const NOISE_S = 1;

/** The frequency of a `'scale'` cue at `step` (an integer >= 0; anything else is step 0). */
export function scaleHz(step: number | undefined): number {
  const index = step !== undefined && Number.isInteger(step) && step > 0 ? Math.min(step, SOLVE_SCALE_HZ.length - 1) : 0;
  return SOLVE_SCALE_HZ[index] ?? 659.26;
}

function defaultContext(): WebAudioContext | null {
  const g = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = g.AudioContext ?? g.webkitAudioContext;
  return Ctor === undefined ? null : new Ctor({ latencyHint: 'interactive' });
}

function defaultSession(): AudioSessionLike | null {
  const nav = (globalThis as { navigator?: { audioSession?: AudioSessionLike } }).navigator;
  return nav?.audioSession ?? null;
}

/**
 * The web `AudioPort` (AD-16): every cue synthesised with Web Audio (no audio
 * files). Never uses `<audio>` elements: in WKWebView and Safari, Web Audio plays
 * in the ambient audio session, which the iOS mute switch silences; the adapter
 * also asks for `ambient` through `navigator.audioSession` where it exists.
 *
 * The context is created on the first `unlock` (a user gesture), so nothing plays
 * before it; `suspend` / `resume` follow the app's lifecycle. With no Web Audio,
 * or on any failure, it does nothing. Never throws.
 */
export function webAudio(options: WebAudioOptions = {}): AudioPort {
  const createContext = options.createContext ?? defaultContext;
  const random = options.random ?? Math.random;
  const session = options.audioSession === undefined ? defaultSession() : options.audioSession;
  if (session !== null) {
    try {
      session.type = 'ambient';
    } catch {
      // Read-only or unsupported: the default session is ambient for Web Audio anyway.
    }
  }

  let ctx: WebAudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  /** The context could not be created: stay silent for good. */
  let unavailable = false;
  /** The app is in the background (`suspend`). */
  let backgrounded = false;
  /** An `unlock` asked the context to resume and it has not settled yet: cues may be queued. */
  let resuming = false;
  let channels: AudioChannels = { effects: true, music: false };

  function resumeContext(context: WebAudioContext): void {
    if (context.state === 'running' || context.state === 'closed') return;
    resuming = true;
    context.resume().then(
      () => {
        resuming = false;
      },
      () => {
        resuming = false;
      },
    );
  }

  function noiseBuffer(context: WebAudioContext): AudioBuffer {
    if (noise !== null) return noise;
    const length = Math.max(1, Math.floor(context.sampleRate * NOISE_S));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = random() * 2 - 1;
    noise = buffer;
    return buffer;
  }

  function envelope(context: WebAudioContext, out: AudioNode, cue: ToneCue | NoiseCue, t: number): GainNode {
    const gain = context.createGain();
    gain.gain.setValueAtTime(FLOOR, t);
    gain.gain.linearRampToValueAtTime(cue.peak, t + cue.attackS);
    gain.gain.exponentialRampToValueAtTime(FLOOR, t + cue.durationS);
    gain.connect(out);
    return gain;
  }

  function schedule(context: WebAudioContext, out: AudioNode, cue: ToneCue | NoiseCue, params: CueParams | undefined): void {
    const t = context.currentTime;
    const gain = envelope(context, out, cue, t);
    if (cue.kind === 'tone') {
      const osc = context.createOscillator();
      osc.type = cue.wave;
      osc.frequency.setValueAtTime(cue.hz === 'scale' ? scaleHz(params?.step) : cue.hz, t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + cue.durationS + TAIL_S);
      return;
    }
    const filter = context.createBiquadFilter();
    filter.type = cue.filter;
    filter.Q.setValueAtTime(cue.q, t);
    filter.frequency.setValueAtTime(cue.fromHz, t);
    filter.frequency.exponentialRampToValueAtTime(cue.toHz, t + cue.durationS);
    filter.connect(gain);
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(context);
    source.connect(filter);
    source.start(t);
    source.stop(t + cue.durationS + TAIL_S);
  }

  return {
    unlock() {
      if (unavailable || backgrounded) return;
      try {
        if (ctx === null) {
          ctx = createContext();
          if (ctx === null) {
            unavailable = true;
            return;
          }
          master = ctx.createGain();
          master.gain.setValueAtTime(MASTER_GAIN, ctx.currentTime);
          master.connect(ctx.destination);
          // iOS unlocks output fully once a source has started inside a gesture: a one-sample silence.
          const silence = ctx.createBufferSource();
          silence.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
          silence.connect(ctx.destination);
          silence.start();
        }
        resumeContext(ctx);
      } catch {
        if (ctx === null) unavailable = true;
      }
    },
    play(cue, params) {
      // Locked (no gesture yet), backgrounded, or effects off: silently skipped.
      if (ctx === null || master === null || backgrounded || !channels.effects) return;
      // A context that is neither running nor about to would queue the cue and play it late.
      if (ctx.state !== 'running' && !resuming) return;
      try {
        schedule(ctx, master, CUES[cue], params);
      } catch {
        // Degrade silently (no dialogs during play).
      }
    },
    setEnabled(next) {
      channels = { effects: next.effects, music: next.music };
    },
    suspend() {
      backgrounded = true;
      resuming = false;
      ctx?.suspend().catch(() => {});
    },
    resume() {
      backgrounded = false;
      // May be refused outside a gesture; the next tap's `unlock` resumes it then.
      if (ctx !== null) resumeContext(ctx);
    },
  };
}

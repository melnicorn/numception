import { describe, expect, it } from 'vitest';
import { CUES, MASTER_GAIN, SOLVE_SCALE_HZ, scaleHz, type WebAudioContext, webAudio } from './web-audio-adapter';
import { type FeedbackFlagStorage, webFeedbackFlags } from './web-feedback-flags';

type ParamEvent = { readonly fn: string; readonly value: number; readonly at: number };

class FakeParam {
  readonly events: ParamEvent[] = [];
  setValueAtTime(value: number, at: number) {
    this.events.push({ fn: 'set', value, at });
    return this;
  }
  linearRampToValueAtTime(value: number, at: number) {
    this.events.push({ fn: 'linear', value, at });
    return this;
  }
  exponentialRampToValueAtTime(value: number, at: number) {
    this.events.push({ fn: 'exp', value, at });
    return this;
  }
}

class FakeNode {
  readonly connections: unknown[] = [];
  constructor(readonly kind: string) {}
  connect(to: unknown) {
    this.connections.push(to);
    return to;
  }
}

class FakeSource extends FakeNode {
  type = '';
  buffer: unknown = null;
  readonly frequency = new FakeParam();
  starts: number[] = [];
  stops: number[] = [];
  start(at = 0) {
    this.starts.push(at);
  }
  stop(at = 0) {
    this.stops.push(at);
  }
}

/** A fake AudioContext recording every node it creates. */
class FakeContext {
  currentTime = 2;
  sampleRate = 100;
  state: string = 'suspended';
  readonly destination = new FakeNode('destination');
  readonly nodes: (FakeNode & Record<string, unknown>)[] = [];
  resumes = 0;
  suspends = 0;
  private settle: (() => void) | null = null;
  private add<T extends FakeNode>(node: T): T {
    this.nodes.push(node as unknown as FakeNode & Record<string, unknown>);
    return node;
  }
  createGain() {
    return this.add(Object.assign(new FakeNode('gain'), { gain: new FakeParam() }));
  }
  createOscillator() {
    return this.add(new FakeSource('oscillator'));
  }
  createBufferSource() {
    return this.add(new FakeSource('bufferSource'));
  }
  createBiquadFilter() {
    return this.add(Object.assign(new FakeNode('filter'), { type: '', frequency: new FakeParam(), Q: new FakeParam() }));
  }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { length, getChannelData: () => data };
  }
  resume() {
    this.resumes += 1;
    return new Promise<void>((resolve) => {
      this.settle = () => {
        this.state = 'running';
        resolve();
      };
    });
  }
  /** Completes the pending resume. */
  async run() {
    this.settle?.();
    await Promise.resolve();
  }
  suspend() {
    this.suspends += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
  of(kind: string) {
    return this.nodes.filter((n) => n.kind === kind);
  }
}

function setup(session: { type: string } | null = null) {
  const fake = new FakeContext();
  let created = 0;
  const audio = webAudio({
    createContext: () => {
      created += 1;
      return fake as unknown as WebAudioContext;
    },
    audioSession: session,
    random: () => 0.75,
  });
  return { audio, fake, created: () => created };
}

/** The nodes one `play` adds after unlocking. */
async function played(cue: Parameters<ReturnType<typeof webAudio>['play']>[0], params?: { step?: number }) {
  const { audio, fake } = setup();
  audio.unlock();
  await fake.run();
  const before = fake.nodes.length;
  audio.play(cue, params);
  return { fake, added: fake.nodes.slice(before) };
}

describe('webAudio', () => {
  it('asks for the ambient audio session where the API exists', () => {
    const session = { type: 'auto' };
    setup(session);
    expect(session.type).toBe('ambient');
  });

  it('creates nothing and plays nothing before the first unlock', () => {
    const { audio, fake, created } = setup();
    audio.play('solve', { step: 0 });
    expect(created()).toBe(0);
    expect(fake.nodes).toEqual([]);
  });

  it('unlock creates the context once, behind a modest master gain, and resumes it', async () => {
    const { audio, fake, created } = setup();
    audio.unlock();
    audio.unlock();
    expect(created()).toBe(1);
    const master = fake.of('gain')[0];
    expect((master?.gain as FakeParam).events).toEqual([{ fn: 'set', value: MASTER_GAIN, at: 2 }]);
    expect(master?.connections).toEqual([fake.destination]);
    expect(fake.resumes).toBeGreaterThanOrEqual(1);
    await fake.run();
    audio.unlock();
    const resumes = fake.resumes;
    audio.unlock();
    expect(fake.resumes).toBe(resumes);
  });

  it.each([
    [0, 659.26],
    [1, 587.33],
    [2, 523.25],
  ])('solve at step %i is a short sine at %f Hz with a gentle envelope', async (step, hz) => {
    const { added } = await played('solve', { step });
    const [gain, osc] = added;
    expect(osc?.kind).toBe('oscillator');
    expect(osc?.type).toBe('sine');
    expect((osc?.frequency as FakeParam).events).toEqual([{ fn: 'set', value: hz, at: 2 }]);
    expect((gain?.gain as FakeParam).events.map((e) => e.fn)).toEqual(['set', 'linear', 'exp']);
    const peak = (gain?.gain as FakeParam).events[1];
    expect(peak?.value).toBe(CUES.solve.peak);
    expect(peak?.at).toBeCloseTo(2.015);
    expect((osc as unknown as FakeSource).starts).toEqual([2]);
    expect((osc as unknown as FakeSource).stops[0]).toBeCloseTo(2.2);
  });

  it('steps down the pentatonic scale, holding the lowest note past its end', () => {
    expect([0, 1, 2, 3, 4].map(scaleHz)).toEqual(SOLVE_SCALE_HZ.slice(0, 5));
    expect(scaleHz(99)).toBe(SOLVE_SCALE_HZ.at(-1));
    expect(scaleHz(undefined)).toBe(659.26);
    expect(scaleHz(-1)).toBe(659.26);
  });

  it('wrongZen is a soft low triangle tone', async () => {
    const { added } = await played('wrongZen');
    const osc = added.find((n) => n.kind === 'oscillator');
    expect(osc?.type).toBe('triangle');
    expect((osc?.frequency as FakeParam).events[0]?.value).toBe(196);
  });

  it.each([
    ['softMiss', 2200, 1600],
    ['whoosh', 300, 2400],
  ] as const)('%s is filtered noise, its filter swept from %i to %i Hz', async (cue, from, to) => {
    const { added } = await played(cue);
    expect(added.map((n) => n.kind)).toEqual(['gain', 'filter', 'bufferSource']);
    const filter = added[1];
    expect(filter?.type).toBe('bandpass');
    expect((filter?.frequency as FakeParam).events.map((e) => [e.fn, e.value])).toEqual([
      ['set', from],
      ['exp', to],
    ]);
    const source = added[2] as unknown as FakeSource;
    expect(source.buffer).not.toBeNull();
    expect(source.stops[0]).toBeCloseTo(2 + CUES[cue].durationS + 0.02);
  });

  it('makes the noise buffer once and shares it', async () => {
    const { audio, fake } = setup();
    audio.unlock();
    await fake.run();
    audio.play('whoosh');
    audio.play('softMiss');
    const [first, second] = fake.of('bufferSource').slice(1) as unknown as FakeSource[];
    expect(first?.buffer).toBeDefined();
    expect(second?.buffer).toBe(first?.buffer);
    expect((first?.buffer as { getChannelData(): Float32Array }).getChannelData()[0]).toBe(0.5);
  });

  it('never clips: every cue peak times the master gain stays well under 1', () => {
    for (const cue of Object.values(CUES)) expect(cue.peak * MASTER_GAIN).toBeLessThanOrEqual(0.25);
  });

  it('plays nothing with effects off, while suspended for the lifecycle, or before the context runs', async () => {
    const { audio, fake } = setup();
    audio.unlock();
    await fake.run();
    const count = () => fake.of('oscillator').length;
    audio.setEnabled({ effects: false, music: false });
    audio.play('solve');
    expect(count()).toBe(0);
    audio.setEnabled({ effects: true, music: false });
    audio.suspend();
    expect(fake.suspends).toBe(1);
    audio.play('solve');
    audio.unlock();
    expect(count()).toBe(0);
    audio.resume();
    // The context has not resumed yet, but a resume is in flight: the cue is queued.
    audio.play('solve');
    expect(count()).toBe(1);
    await fake.run();
    audio.play('solve');
    expect(count()).toBe(2);
    // A context stopped by the OS, with no resume asked for: skipped, not queued to play late.
    fake.state = 'interrupted';
    audio.play('solve');
    expect(count()).toBe(2);
  });

  it('with no Web Audio does nothing, and never asks again', () => {
    let asked = 0;
    const audio = webAudio({
      createContext: () => {
        asked += 1;
        return null;
      },
      audioSession: null,
    });
    audio.unlock();
    audio.unlock();
    audio.play('whoosh');
    audio.suspend();
    audio.resume();
    expect(asked).toBe(1);
  });

  it('a context that throws on creation is treated as no Web Audio', () => {
    const audio = webAudio({
      createContext: () => {
        throw new Error('blocked');
      },
      audioSession: null,
    });
    expect(() => {
      audio.unlock();
      audio.play('solve');
    }).not.toThrow();
  });
});

describe('webFeedbackFlags', () => {
  function memory(): FeedbackFlagStorage & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
  }

  it('reads the defaults until written, then what was written, per appId', () => {
    const storage = memory();
    const store = webFeedbackFlags('app.numception.dev', () => storage);
    expect(store.read()).toEqual({ effects: true, music: false, haptics: true });
    store.write({ effects: false, music: false, haptics: true });
    expect(store.read()).toEqual({ effects: false, music: false, haptics: true });
    expect(webFeedbackFlags('app.numception.playtest', () => storage).read()).toEqual({ effects: true, music: false, haptics: true });
    store.write({ effects: true, music: false, haptics: false });
    expect(store.read()).toEqual({ effects: true, music: false, haptics: false });
  });

  it('reads flags stored before haptics existed with haptics on', () => {
    const storage = memory();
    storage.map.set('numception:feedback-flags:a', JSON.stringify({ effects: false, music: false }));
    expect(webFeedbackFlags('a', () => storage).read()).toEqual({ effects: false, music: false, haptics: true });
  });

  it('reads malformed or unreadable storage as the defaults, and drops failed writes', () => {
    const storage = memory();
    storage.map.set('numception:feedback-flags:a', '{not json');
    expect(webFeedbackFlags('a', () => storage).read()).toEqual({ effects: true, music: false, haptics: true });
    const broken: FeedbackFlagStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = webFeedbackFlags('a', () => broken);
    expect(store.read()).toEqual({ effects: true, music: false, haptics: true });
    expect(() => store.write({ effects: false, music: false, haptics: true })).not.toThrow();
    expect(webFeedbackFlags('a', () => null).read()).toEqual({ effects: true, music: false, haptics: true });
  });
});

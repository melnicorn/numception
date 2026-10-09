// DOM fps and cold-start overlay (README "Readout"). Call frame() once per rendered
// frame with performance.now(). Allocation-free per frame: frame times live in a
// fixed ring buffer large enough for 5 s at 240 Hz.

const UPDATE_MS = 500;
const WINDOW_MS = 5000;
const CAPACITY = 2048;

export interface Readout {
  frame(now: number): void;
}

export function createReadout(el: HTMLElement): Readout {
  const times = new Float64Array(CAPACITY);
  let head = 0; // next write index
  let count = 0;
  let firstFrameMs = -1;
  let intervalStart = -1;
  let intervalFrames = 0;

  function rollingAverage(now: number): number {
    // Walk back from the newest frame until we leave the 5 s window.
    let n = 0;
    let oldest = now;
    for (let i = 1; i <= count; i++) {
      const t = times[(head - i + CAPACITY) % CAPACITY];
      if (now - t > WINDOW_MS) break;
      oldest = t;
      n++;
    }
    const span = now - oldest;
    return n > 1 && span > 0 ? ((n - 1) * 1000) / span : 0;
  }

  return {
    frame(now: number) {
      times[head] = now;
      head = (head + 1) % CAPACITY;
      if (count < CAPACITY) count++;

      // An interval's start frame belongs to the previous interval (or, for the
      // first one, to none), so every interval counts the frames after its start.
      if (firstFrameMs < 0) {
        firstFrameMs = now;
        intervalStart = now;
        el.textContent = `fps – · avg – · first frame ${Math.round(firstFrameMs)} ms`;
        return;
      }
      intervalFrames++;

      const elapsed = now - intervalStart;
      if (elapsed >= UPDATE_MS) {
        const instantFps = (intervalFrames * 1000) / elapsed;
        intervalStart = now;
        intervalFrames = 0;
        el.textContent =
          `fps ${instantFps.toFixed(0)} · avg ${rollingAverage(now).toFixed(1)}` +
          ` · first frame ${Math.round(firstFrameMs)} ms`;
      }
    },
  };
}

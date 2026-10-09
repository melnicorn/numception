import { Application } from 'pixi.js';
import { type BakeoffDebug, BakeoffScene, bakeoffDebug } from './bakeoff-scene';
import { createReadout } from './readout';

// PixiJS renders at device pixel ratio natively: `resolution` sets the backing store
// to viewport x DPR device pixels and `autoDensity` sizes the canvas in CSS pixels.
// Filters set their own resolution in the scene (the Filter default is 1).

declare global {
  interface Window {
    // Read-only debug hook for the e2e spec; see bakeoffDebug.
    readonly __bakeoff: Readonly<BakeoffDebug>;
  }
}

Object.defineProperty(window, '__bakeoff', { value: bakeoffDebug, writable: false });

const app = new Application();
await app.init({
  preference: 'webgl',
  background: '#05060a',
  resizeTo: window,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true,
  powerPreference: 'high-performance',
});
document.getElementById('game')!.appendChild(app.canvas);

let scene = new BakeoffScene(app);
app.ticker.add((ticker) => scene.update(ticker.deltaMS));

// Context loss: PixiJS restores GL itself (its listener was added first, so it has
// already run); restart the scene so the generated dot texture and filter targets
// are rebuilt from scratch.
app.canvas.addEventListener('webglcontextrestored', () => {
  console.info('bake-off: WebGL context restored, restarting the scene');
  bakeoffDebug.restarts++;
  scene.destroy();
  scene = new BakeoffScene(app);
});

const readoutEl = document.getElementById('readout');
if (readoutEl) {
  const readout = createReadout(readoutEl);
  app.renderer.runners.postrender.add({ postrender: () => readout.frame(performance.now()) });
}

import * as Phaser from 'phaser';
import { type BakeoffDebug, BakeoffScene, bakeoffDebug } from './bakeoff-scene';
import { createReadout } from './readout';

// Phaser 4 has no `resolution` setting, so render at device pixel ratio by hand:
// the game (canvas backing store) is viewport x DPR device pixels, and the canvas is
// displayed at 1/DPR zoom so it covers exactly the viewport in CSS pixels.

function viewport(): { width: number; height: number; dpr: number } {
  const dpr = window.devicePixelRatio || 1;
  return {
    width: Math.max(1, Math.round(window.innerWidth * dpr)),
    height: Math.max(1, Math.round(window.innerHeight * dpr)),
    dpr,
  };
}

declare global {
  interface Window {
    // Read-only debug hook for the e2e spec; see bakeoffDebug.
    readonly __bakeoff: Readonly<BakeoffDebug>;
  }
}

Object.defineProperty(window, '__bakeoff', { value: bakeoffDebug, writable: false });

const initial = viewport();

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  backgroundColor: '#05060a',
  banner: false,
  antialias: true,
  powerPreference: 'high-performance',
  audio: { noAudio: true },
  input: { keyboard: false, mouse: false, touch: false, gamepad: false },
  scale: {
    mode: Phaser.Scale.NONE,
    width: initial.width,
    height: initial.height,
    zoom: 1 / initial.dpr,
    autoRound: false,
  },
  scene: [BakeoffScene],
});

window.addEventListener('resize', () => {
  const { width, height, dpr } = viewport();
  game.scale.resize(width, height);
  game.scale.setZoom(1 / dpr);
});

const readoutEl = document.getElementById('readout');
if (readoutEl) {
  const readout = createReadout(readoutEl);
  game.events.on(Phaser.Core.Events.POST_RENDER, () => readout.frame(performance.now()));
}

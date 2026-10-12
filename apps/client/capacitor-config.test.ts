import type { CapacitorConfig } from '@capacitor/cli';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FLAVOUR_NAMES, FLAVOURS } from './flavours.ts';

// capacitor.config.ts reads FLAVOUR and BAKEOFF at import time, so each case re-imports it.
async function loadConfig(env: { FLAVOUR?: string; BAKEOFF?: string }): Promise<CapacitorConfig> {
  vi.resetModules();
  vi.stubEnv('FLAVOUR', env.FLAVOUR);
  vi.stubEnv('BAKEOFF', env.BAKEOFF);
  const { default: config } = await import('./capacitor.config.ts');
  return config;
}

async function loadWebDir(bakeoff: string | undefined): Promise<string | undefined> {
  return (await loadConfig({ BAKEOFF: bakeoff })).webDir;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('capacitor config flavours', () => {
  it('builds dev when FLAVOUR is unset or empty', async () => {
    for (const FLAVOUR of [undefined, '']) {
      const config = await loadConfig({ FLAVOUR });
      expect(config.appId).toBe('app.numception.dev');
      expect(config.appName).toBe('Numception Dev');
      expect(config.webDir).toBe('dist/dev');
    }
  });

  it('takes appId, appName and webDir from the flavour table', async () => {
    for (const name of FLAVOUR_NAMES) {
      const config = await loadConfig({ FLAVOUR: name });
      expect(config.appId).toBe(FLAVOURS[name].appId);
      expect(config.appName).toBe(FLAVOURS[name].appName);
      expect(config.webDir).toBe(`dist/${name}`);
      expect(config.loggingBehavior).toBeUndefined();
    }
  });

  it('rejects an unknown FLAVOUR, naming the valid flavours', async () => {
    await expect(loadConfig({ FLAVOUR: 'staging' })).rejects.toThrow(
      'Unknown FLAVOUR="staging". Expected one of: dev, playtest, prod',
    );
    await expect(loadConfig({ FLAVOUR: 'constructor' })).rejects.toThrow('Unknown FLAVOUR="constructor"');
  });

  it('lets BAKEOFF override webDir but keeps the flavour ids', async () => {
    const config = await loadConfig({ FLAVOUR: 'playtest', BAKEOFF: 'pixi' });
    expect(config.webDir).toBe('../../prototypes/renderer-bakeoff/pixi/dist');
    expect(config.appId).toBe('app.numception.playtest');
    expect(config.loggingBehavior).toBe('production');
  });
});

describe('capacitor config webDir', () => {
  it('ships the client when BAKEOFF is unset or empty', async () => {
    expect(await loadWebDir(undefined)).toBe('dist/dev');
    expect(await loadWebDir('')).toBe('dist/dev');
  });

  it('ships the Phaser bake-off build when BAKEOFF=phaser', async () => {
    expect(await loadWebDir('phaser')).toBe('../../prototypes/renderer-bakeoff/phaser/dist');
  });

  it('ships the PixiJS bake-off build when BAKEOFF=pixi', async () => {
    expect(await loadWebDir('pixi')).toBe('../../prototypes/renderer-bakeoff/pixi/dist');
  });

  it('rejects an unknown BAKEOFF value', async () => {
    await expect(loadWebDir('bogus')).rejects.toThrow('Unknown BAKEOFF="bogus"');
    // Inherited Object.prototype keys are not bake-off targets.
    await expect(loadWebDir('constructor')).rejects.toThrow('Unknown BAKEOFF="constructor"');
  });
});

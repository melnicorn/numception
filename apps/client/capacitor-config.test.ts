import { afterEach, describe, expect, it, vi } from 'vitest';

// capacitor.config.ts reads BAKEOFF at import time, so each case re-imports it.
async function loadWebDir(bakeoff: string | undefined): Promise<string | undefined> {
  vi.resetModules();
  vi.stubEnv('BAKEOFF', bakeoff);
  const { default: config } = await import('./capacitor.config.ts');
  return config.webDir;
}

describe('capacitor config webDir', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ships the client when BAKEOFF is unset or empty', async () => {
    expect(await loadWebDir(undefined)).toBe('dist');
    expect(await loadWebDir('')).toBe('dist');
  });

  it('ships the Phaser bake-off build when BAKEOFF=phaser', async () => {
    expect(await loadWebDir('phaser')).toBe('../../prototypes/renderer-bakeoff/phaser/dist');
  });

  it('rejects an unknown BAKEOFF value', async () => {
    await expect(loadWebDir('pixi')).rejects.toThrow('Unknown BAKEOFF="pixi"');
    // Inherited Object.prototype keys are not bake-off targets.
    await expect(loadWebDir('constructor')).rejects.toThrow('Unknown BAKEOFF="constructor"');
  });
});

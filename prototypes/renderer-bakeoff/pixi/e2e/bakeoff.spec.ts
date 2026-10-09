import { expect, test, type Page } from '@playwright/test';

// Covers the plan's I/O matrix rows Loop, Particles, Readout and Context loss
// through the read-only window.__bakeoff hook (see bakeoffDebug in the scene).
// The assertions are the same as the Phaser build's spec.

const debug = (page: Page) => page.evaluate(() => ({ ...window.__bakeoff }));

test('runs the loop with 200 particles, a live readout and recovers from context loss', async ({
  page,
}) => {
  test.setTimeout(30_000);
  await page.goto('./');

  // Readout: fps, rolling average and first-frame time are all numbers.
  await expect(page.locator('#readout')).toHaveText(
    /^fps \d+ · avg \d+(\.\d+)? · first frame \d+ ms$/,
    { timeout: 5_000 },
  );

  // Particles: exactly 200 alive at two sample points.
  expect((await debug(page)).liveParticles).toBe(200);
  await page.waitForTimeout(700);
  expect((await debug(page)).liveParticles).toBe(200);

  // Loop: at least one full 5 s loop after ~5.5 s.
  await expect.poll(async () => (await debug(page)).loopsCompleted, { timeout: 10_000 }).toBeGreaterThanOrEqual(1);

  // Context loss: force a WebGL context loss and restore; the scene restarts.
  await page.evaluate(async () => {
    const canvas = document.querySelector('canvas')!;
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const ext = gl?.getExtension('WEBGL_lose_context');
    if (!ext) throw new Error('WEBGL_lose_context unavailable');
    ext.loseContext();
    await new Promise((resolve) => setTimeout(resolve, 300));
    ext.restoreContext();
  });
  await expect.poll(async () => (await debug(page)).restarts, { timeout: 5_000 }).toBeGreaterThanOrEqual(1);

  // ...and the loop keeps running afterwards.
  const loopsAfterRestore = (await debug(page)).loopsCompleted;
  await expect
    .poll(async () => (await debug(page)).loopsCompleted, { timeout: 12_000 })
    .toBeGreaterThan(loopsAfterRestore);
  expect((await debug(page)).liveParticles).toBe(200);
});

import { expect, test, type Page } from '@playwright/test';

// Covers the plan's I/O matrix rows Loop, Particles, Readout and Context loss
// through the read-only window.__bakeoff hook (see bakeoffDebug in the scene).
// The assertions are the same as the Phaser build's spec.

const debug = (page: Page) => page.evaluate(() => ({ ...window.__bakeoff }));

const LOOP_SECONDS = 5;

// Waits until loopsCompleted exceeds `after`. The scene's clock clamps each frame
// to 100 ms, so under software WebGL (CI runners have no GPU; 2-3 fps was seen)
// a 5 s loop takes far longer than 5 s of real time. The wait is sized from the
// measured clock speed, and a stalled clock fails straight away.
async function waitForLoopAfter(page: Page, after: number): Promise<void> {
  const a = await debug(page);
  await page.waitForTimeout(2_000);
  const b = await debug(page);
  const speed = (b.sceneSeconds - a.sceneSeconds) / 2; // scene seconds per real second
  expect(speed, 'scene clock advances (at least ~1 fps)').toBeGreaterThan(0.1);
  const timeout = Math.ceil((LOOP_SECONDS / speed) * 1_500) + 2_000;
  await expect.poll(async () => (await debug(page)).loopsCompleted, { timeout }).toBeGreaterThan(after);
}

test('runs the loop with 200 particles, a live readout and recovers from context loss', async ({
  page,
}) => {
  // Each loop wait is capped by the clock-speed floor above (<= ~77 s apiece).
  test.setTimeout(240_000);
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

  // Loop: at least one full 5 s loop.
  await waitForLoopAfter(page, 0);

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
  await expect.poll(async () => (await debug(page)).restarts, { timeout: 15_000 }).toBeGreaterThanOrEqual(1);

  // ...and the loop keeps running afterwards.
  const loopsAfterRestore = (await debug(page)).loopsCompleted;
  await waitForLoopAfter(page, loopsAfterRestore);
  expect((await debug(page)).liveParticles).toBe(200);
});

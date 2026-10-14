import { expect, type Page, test } from '@playwright/test';
import { answerCell, clickUnit, pixelAt, rgbOf, solve, view, waitForPuzzle, waitIdle } from './play-helpers';

// Minimal motion (EXPERIENCE Accessibility Floor, ticket 6.4) on the playtest build:
// with the OS asking for reduced motion, core caps play at Minimal, so zooms (the
// advance and collapse beats) become cuts with a crossfade and the round change is a
// crossfade of at least 400 ms. The renderer counts the frames it draws per beat
// style (`renderStats().beats`), so the specs see how each beat was drawn.

/** One frame at 60 Hz, ms. */

type Beats = Partial<Record<'idle' | 'solve' | 'zoom' | 'cut' | 'themeChange' | 'crossfade', number>>;
type MotionHook = {
  renderStats(): { beats: Beats };
  view(): { motion?: string; presentation: { kind: string; transitionId: string; durationMs: number } } | null;
};

async function beats(page: Page): Promise<Beats> {
  return page.evaluate(() => (window as unknown as { __numception: MotionHook }).__numception.renderStats().beats);
}

/**
 * From now until the next idle frame after a `roundStart` beat: the wall time the
 * round change was on screen (first `roundStart` frame to the first idle one), with
 * its transition and duration.
 */
function timeRoundChange(page: Page): Promise<{ ms: number; transitionId: string; durationMs: number }> {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const hook = (window as unknown as { __numception: MotionHook }).__numception;
        let start: number | null = null;
        let seen = { transitionId: '', durationMs: 0 };
        const frame = (now: number) => {
          const p = hook.view()?.presentation;
          if (start === null && p?.kind === 'roundStart') {
            start = now;
            seen = { transitionId: p.transitionId, durationMs: p.durationMs };
          } else if (start !== null && p?.kind !== 'roundStart') {
            resolve({ ms: now - start, ...seen });
            return;
          }
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
}

test.describe('with OS Reduce Motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('zooms are drawn as cuts, and the round change as a crossfade of at least 400 ms', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    const first = await waitForPuzzle(page);
    expect((first as unknown as { motion?: string }).motion).toBe('minimal');

    // Three leaves: two advances and the collapse into the top, each a cut.
    for (let k = 0; k < 3; k += 1) await solve(page);
    const top = await waitIdle(page);
    expect(top.nodeId).toEqual({ tier: 2, index: 0 });
    const afterLeaves = await beats(page);
    expect(afterLeaves.zoom).toBeUndefined();
    expect(afterLeaves.cut ?? 0).toBeGreaterThan(0);

    // The top: the round change.
    const timing = timeRoundChange(page);
    await clickUnit(page, (await answerCell(page)).labelPoint);
    const change = await timing;
    expect(change.transitionId).toBe('crossfade');
    expect(change.durationMs).toBeGreaterThanOrEqual(400);
    // On screen for at least 400 ms of wall time (the 450 ms beat covers the first
    // frame already being under way).
    expect(change.ms).toBeGreaterThanOrEqual(400);
    const next = await waitIdle(page);
    expect(next.theme.themeId).not.toBe(first.theme.themeId);
    const all = await beats(page);
    expect(all.zoom).toBeUndefined();
    expect(all.themeChange).toBeUndefined();
    expect(all.crossfade ?? 0).toBeGreaterThan(0);
    // The new theme fills the screen once it is done.
    const band = await pixelAt(page, [4, 4]);
    const surface = rgbOf(next.theme.surface);
    expect(Math.max(...band.map((c, i) => Math.abs(c - (surface[i] ?? 0))))).toBeLessThan(6);
  });
});

test('without Reduce Motion the zooms move the camera; the Minimal setting in the dev panel cuts them', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./');
  const first = await waitForPuzzle(page);
  expect((first as unknown as { motion?: string }).motion).toBe('calm');
  await solve(page);
  expect((await beats(page)).zoom ?? 0).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Dev panel' }).click();
  await page.getByRole('combobox', { name: /Motion/ }).selectOption('minimal');
  await expect(page.getByTestId('dev-effective-motion')).toHaveText('(effective: minimal)');
  await page.getByRole('button', { name: 'Dev panel' }).click();
  expect((await view(page) as unknown as { motion?: string }).motion).toBe('minimal');
  const zooms = (await beats(page)).zoom ?? 0;
  await solve(page);
  const after = await beats(page);
  expect(after.zoom ?? 0).toBe(zooms);
  expect(after.cut ?? 0).toBeGreaterThan(0);
});

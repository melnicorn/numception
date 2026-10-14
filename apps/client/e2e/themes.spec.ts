import { expect, type Page, test } from '@playwright/test';
import { answerCell, clickUnit, colorDistance, frameInk, pixelAt, rgbOf, solve, view, waitBeat, waitForPuzzle, waitIdle } from './play-helpers';

// A new theme each round (FR-25, AD-15) on the playtest build: core picks the
// round's theme from the bundled catalogue (Kiln and Moonwater, both Zen), the
// round change is a whole-frame theme change, and a reload keeps the theme.

type SaveHook = { saves(): { written: number; busy: boolean } | null };

async function waitSaved(page: Page, atLeast: number): Promise<void> {
  await expect
    .poll(async () => {
      const s = await page.evaluate(() => (window as unknown as { __numception: SaveHook }).__numception.saves());
      return s !== null && !s.busy && s.written >= atLeast;
    })
    .toBe(true);
}

async function savesWritten(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __numception: SaveHook }).__numception.saves()?.written ?? 0);
}

/** Solves the four puzzles of the opening Classic round; returns the next round's first idle view. */
async function finishFirstRound(page: Page) {
  for (let k = 0; k < 4; k += 1) await solve(page);
  return waitIdle(page);
}

test('consecutive rounds are drawn in different themes, over the whole screen', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const first = await waitForPuzzle(page);
  // A profile opens in Kiln, the first-run theme.
  expect(first.theme.themeId).toBe('kiln');
  const kilnBare = 1 - (await frameInk(page, first.theme)).ink;
  expect(kilnBare).toBeGreaterThan(0.2);
  // The page around the canvas (the guide-line band) is the same surface.
  expect(colorDistance(await pixelAt(page, [4, 4]), rgbOf(first.theme.surface))).toBeLessThan(6);

  const next = await finishFirstRound(page);
  expect(next.nodeId).toEqual({ tier: 1, index: 0 });
  expect(next.theme.themeId).not.toBe(first.theme.themeId);
  expect(next.theme.themeId).toBe('moonwater');
  expect(next.theme.mode).toBe('zen');
  expect(colorDistance(rgbOf(next.theme.surface), rgbOf(first.theme.surface))).toBeGreaterThan(100);
  // The canvas surface changed: almost nothing of Kiln's surface is left, and Moonwater's fills the field.
  expect(1 - (await frameInk(page, first.theme)).ink).toBeLessThan(0.01);
  expect(1 - (await frameInk(page, next.theme)).ink).toBeGreaterThan(0.2);
  expect(colorDistance(await pixelAt(page, [4, 4]), rgbOf(next.theme.surface))).toBeLessThan(6);
});

test('the round change shifts the whole frame through a mid-luminance surface before the old board leaves', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForPuzzle(page);
  for (let k = 0; k < 3; k += 1) await solve(page);
  const top = await waitIdle(page);
  expect(top.nodeId).toEqual({ tier: 2, index: 0 });
  await clickUnit(page, (await answerCell(page)).labelPoint);
  // Colours move over the first half of the beat: a quarter in, the field is mid-way.
  const mid = await waitBeat(page, 'roundStart', 0.2, 0.3);
  expect(mid.presentation.durationMs).toBeGreaterThanOrEqual(900);
  const from = mid.presentation.from?.theme;
  const to = mid.presentation.to?.theme;
  expect([from?.themeId, to?.themeId]).toEqual(['kiln', 'moonwater']);
  // The guide band shows the frame's surface: neither the old theme's nor the new one's, but between.
  const band = await pixelAt(page, [4, 4]);
  const lum = (rgb: readonly number[]) => (0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0)) / 255;
  const [lo, hi] = [lum(rgbOf(to?.surface ?? '#000000')), lum(rgbOf(from?.surface ?? '#FFFFFF'))];
  expect(lum(band)).toBeGreaterThan(lo + 0.1 * (hi - lo));
  expect(lum(band)).toBeLessThan(hi - 0.1 * (hi - lo));
  await waitIdle(page);
});

test('a reload keeps the round’s theme', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./');
  await waitForPuzzle(page);
  const round = await finishFirstRound(page);
  expect(round.theme.themeId).toBe('moonwater');
  await waitSaved(page, (await savesWritten(page)) || 1);
  await page.reload();
  const after = await waitForPuzzle(page);
  expect(after.theme.themeId).toBe('moonwater');
  expect(after.nodeId).toEqual(round.nodeId);
  expect(1 - (await frameInk(page, after.theme)).ink).toBeGreaterThan(0.2);
  expect((await view(page)).theme.surface).toBe(round.theme.surface);
});

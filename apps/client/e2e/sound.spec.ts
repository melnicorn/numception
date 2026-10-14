import { expect, type Page, test } from '@playwright/test';
import { clickUnit, events, roleCell, solve, waitForPuzzle, waitIdle } from './play-helpers';

// Sound through the feedback director (FR-41, AD-16) on the playtest build. Headless
// WebKit has no audible output, so the client records every cue the director plays
// (a recording AudioPort in dev and playtest) and the specs read it through the
// test hook. Round 0 is Classic +: three leaves (tier 1) and the top (tier 2).

type Cue = { cue: string; params?: { step?: number } };

async function cues(page: Page): Promise<Cue[]> {
  return page.evaluate(() => (window as unknown as { __numception: { cues(): Cue[] } }).__numception.cues());
}

test('solves sound one scale step lower per tier, a wrong tap its soft tone, and the round change a whoosh', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./');
  await waitForPuzzle(page);
  // Opening the session is not a round change: silent.
  expect(await cues(page)).toEqual([]);

  await clickUnit(page, (await roleCell(page, 'a')).labelPoint);
  await expect.poll(() => events(page)).toContain('WrongTap');
  expect(await cues(page)).toEqual([{ cue: 'wrongZen' }]);

  for (let k = 0; k < 3; k += 1) await solve(page);
  await solve(page);
  await waitIdle(page);
  expect(await cues(page)).toEqual([
    { cue: 'wrongZen' },
    { cue: 'solve', params: { step: 0 } },
    { cue: 'solve', params: { step: 0 } },
    { cue: 'solve', params: { step: 0 } },
    { cue: 'solve', params: { step: 1 } },
    { cue: 'whoosh' },
  ]);
});

test('turning sound effects off in the dev panel silences every cue, and the choice persists', async ({ page }) => {
  await page.goto('./');
  await waitForPuzzle(page);
  await page.getByRole('button', { name: 'Dev panel' }).click();
  const effects = page.getByRole('checkbox', { name: 'Sound effects' });
  await expect(effects).toBeChecked();
  const music = page.getByRole('checkbox', { name: 'Music (none yet)' });
  await expect(music).toBeDisabled();
  await expect(music).not.toBeChecked();
  await effects.uncheck();
  await expect(effects).not.toBeChecked();
  await page.getByRole('button', { name: 'Dev panel' }).click();

  await solve(page);
  await clickUnit(page, (await roleCell(page, 'a')).labelPoint);
  await expect.poll(() => events(page)).toContain('WrongTap');
  expect(await cues(page)).toEqual([]);

  await page.reload();
  await waitForPuzzle(page);
  await page.getByRole('button', { name: 'Dev panel' }).click();
  await expect(page.getByRole('checkbox', { name: 'Sound effects' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Sound effects' }).check();
  await page.getByRole('button', { name: 'Dev panel' }).click();
  await solve(page);
  expect(await cues(page)).toEqual([{ cue: 'solve', params: { step: 0 } }]);
});

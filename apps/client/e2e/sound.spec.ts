import { expect, type Page, test } from '@playwright/test';
import { clickUnit, events, roleCell, solve, waitForPuzzle, waitIdle } from './play-helpers';

// Sound and haptics through the feedback director (FR-41, AD-16) on the playtest build. Headless
// WebKit has no audible output, so the client records every cue the director plays
// (a recording AudioPort in dev and playtest) and the specs read it through the
// test hook. Round 0 is Classic +: three leaves (tier 1) and the top (tier 2).

type Cue = { cue: string; params?: { step?: number } };

async function cues(page: Page): Promise<Cue[]> {
  return page.evaluate(() => (window as unknown as { __numception: { cues(): Cue[] } }).__numception.cues());
}

/** Waits until the save writer has written everything queued (the settings live in the profile's save). */
async function waitSaved(page: Page): Promise<void> {
  await page.waitForTimeout(50);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __numception: { saves(): { busy: boolean } | null } }).__numception.saves()?.busy))
    .toBe(false);
}

/** The haptic impacts the director asked for (a no-op port on the web; the client records the calls). */
async function haptics(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __numception: { haptics(): string[] } }).__numception.haptics());
}

test('solves sound one scale step lower per tier, a wrong tap its soft tone, and the round change a whoosh', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./');
  await waitForPuzzle(page);
  // Opening the session is not a round change: silent.
  expect(await cues(page)).toEqual([]);
  expect(await haptics(page)).toEqual([]);

  await clickUnit(page, (await roleCell(page, 'a')).labelPoint);
  await expect.poll(() => events(page)).toContain('WrongTap');
  expect(await cues(page)).toEqual([{ cue: 'wrongZen' }]);
  // No haptics on a wrong tap.
  expect(await haptics(page)).toEqual([]);

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
  // A light tap on each solve, none on the round change.
  expect(await haptics(page)).toEqual(['light', 'light', 'light', 'light']);
});

test('turning haptics off in the dev panel stops the solve taps but not the sound, and the setting persists in the save', async ({ page }) => {
  await page.goto('./');
  await waitForPuzzle(page);
  await page.getByRole('button', { name: 'Dev panel' }).click();
  const toggle = page.getByRole('checkbox', { name: 'Haptics' });
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(toggle).not.toBeChecked();
  await page.getByRole('button', { name: 'Dev panel' }).click();

  await solve(page);
  expect(await haptics(page)).toEqual([]);
  expect(await cues(page)).toEqual([{ cue: 'solve', params: { step: 0 } }]);

  await waitSaved(page);
  await page.reload();
  await waitForPuzzle(page);
  await page.getByRole('button', { name: 'Dev panel' }).click();
  await expect(page.getByRole('checkbox', { name: 'Haptics' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Haptics' }).check();
  await page.getByRole('button', { name: 'Dev panel' }).click();
  await solve(page);
  expect(await haptics(page)).toEqual(['light']);
});

test('turning sound effects off in the dev panel silences every cue, and the setting persists in the save', async ({ page }) => {
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

  await waitSaved(page);
  await page.reload();
  await waitForPuzzle(page);
  await page.getByRole('button', { name: 'Dev panel' }).click();
  await expect(page.getByRole('checkbox', { name: 'Sound effects' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Sound effects' }).check();
  await page.getByRole('button', { name: 'Dev panel' }).click();
  await solve(page);
  expect(await cues(page)).toEqual([{ cue: 'solve', params: { step: 0 } }]);
});

test('the old dev feedback flags in localStorage move into the profile settings once', async ({ page }) => {
  await page.goto('./');
  await waitForPuzzle(page);
  // A build from before ticket 6.4 left its flags here (one key per flavour app id).
  await page.evaluate(() => localStorage.setItem('numception:feedback-flags:app.numception.playtest', JSON.stringify({ effects: false, music: false, haptics: true })));
  await page.reload();
  await waitForPuzzle(page);
  await page.getByRole('button', { name: 'Dev panel' }).click();
  await expect(page.getByRole('checkbox', { name: 'Sound effects' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Haptics' })).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('numception:feedback-flags:app.numception.playtest'))).toBeNull();
});

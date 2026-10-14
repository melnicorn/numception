import { expect, type Page, test } from '@playwright/test';
import { eventLog, forceTransition, solve, waitForPuzzle, waitIdle } from './play-helpers';

// The calm transition library (ticket 6.5, AD-15, FR-26) on the playtest build:
// core picks each round change's transition from content/transitions by mode and
// Motion (Zen at the Kid's Calm: calm ones only, never twice running), render
// draws each one, and the dev panel can force or preview any of them.

type Beats = Partial<Record<'themeChange' | 'crossfade' | 'fade' | 'ripple' | 'snow', number>>;
type Hook = { renderStats(): { beats: Beats }; events(): { type: string; transitionId?: string }[]; cues(): { cue: string }[] };

const CALM = ['fade', 'interpolate', 'ripple', 'snow'];
/** The `stats().beats` style each transition is counted under. */
const STYLE: Record<string, keyof Beats> = { interpolate: 'themeChange', crossfade: 'crossfade', fade: 'fade', ripple: 'ripple', snow: 'snow' };

async function beats(page: Page): Promise<Beats> {
  return page.evaluate(() => (window as unknown as { __numception: Hook }).__numception.renderStats().beats);
}

/** The transition of each round change so far (RoundStarted after a RoundCompleted). */
async function roundChanges(page: Page): Promise<string[]> {
  const log = await eventLog(page);
  return log.flatMap((e, i) => (e.type === 'RoundStarted' && log[i - 1]?.type === 'RoundCompleted' ? [(e as { transitionId?: string }).transitionId ?? ''] : []));
}

/** Solves until `count` round changes have run, then waits for idle. */
async function playRoundChanges(page: Page, count: number): Promise<string[]> {
  for (let guard = 0; (await roundChanges(page)).length < count; guard += 1) {
    if (guard > 40) throw new Error('no round change');
    await solve(page);
  }
  await waitIdle(page);
  return roundChanges(page);
}

test('successive round changes draw different calm transitions, each drawn as its own look', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForPuzzle(page);
  // Round 0 (Classic, 4 puzzles) and round 1 (Tower, 13): two round changes.
  const changes = await playRoundChanges(page, 2);
  expect(changes).toHaveLength(2);
  for (const id of changes) expect(CALM).toContain(id);
  expect(changes[1]).not.toBe(changes[0]);
  const drawn = await beats(page);
  for (const id of changes) expect(drawn[STYLE[id] as keyof Beats] ?? 0, id).toBeGreaterThan(0);
  expect(drawn.crossfade).toBeUndefined();
});

test('the dev panel forces a transition for the next round change, with its whoosh', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForPuzzle(page);
  await forceTransition(page, 'ripple');
  const changes = await playRoundChanges(page, 1);
  expect(changes).toEqual(['ripple']);
  expect((await beats(page)).ripple ?? 0).toBeGreaterThan(0);
  const cues = await page.evaluate(() => (window as unknown as { __numception: Hook }).__numception.cues());
  expect(cues.at(-1)).toEqual({ cue: 'whoosh' });
});

test('the dev panel previews every transition at once, without playing a round', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForPuzzle(page);
  const toggle = page.getByRole('button', { name: 'Dev panel' });
  for (const id of ['crossfade', ...CALM]) {
    const style = STYLE[id] as keyof Beats;
    const before = (await beats(page))[style] ?? 0;
    await toggle.click();
    await page.getByRole('button', { name: `Preview ${id}` }).click();
    // Previewing closes the panel so the whole screen shows the transition.
    await expect(page.getByTestId('dev-panel')).toHaveCount(0);
    await expect.poll(async () => (await beats(page))[style] ?? 0, { message: id }).toBeGreaterThan(before + 5);
    // The replay hands back to the game's view: the board is still idle and playable.
    await page.waitForTimeout(1300);
    expect((await waitIdle(page)).kind).toBe('puzzle');
  }
  expect(errors).toEqual([]);
});

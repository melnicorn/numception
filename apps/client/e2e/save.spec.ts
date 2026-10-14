import { expect, type Page, test } from '@playwright/test';
import { answerCell, clickUnit, eventLog, frameInk, solve, solvedCount, view, type View, waitForPuzzle, waitIdle } from './play-helpers';

// Save and resume (FR-10, AD-10) and the lifecycle pause (AD-17) on the playtest
// build. Playwright gives every test a fresh browser context, so each starts with
// an empty IndexedDB.

type SaveHook = {
  mountedView(): View | null;
  pauseReasons(): string[];
  saves(): { written: number; failures: number; busy: boolean } | null;
};

async function saves(page: Page) {
  return page.evaluate(() => (window as unknown as { __numception: SaveHook }).__numception.saves());
}

/** Waits until the writer has written at least `atLeast` snapshots and has nothing in flight. */
async function waitSaved(page: Page, atLeast = 1): Promise<void> {
  await expect.poll(async () => {
    const s = await saves(page);
    return s !== null && !s.busy && s.written >= atLeast;
  }).toBe(true);
}

async function pauseReasons(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __numception: SaveHook }).__numception.pauseReasons());
}

/** Emulates the page going to the background or coming back (Page Visibility). */
async function setVisibility(page: Page, state: 'hidden' | 'visible'): Promise<void> {
  await page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => s === 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

test('saves into the flavour database after the first command', async ({ page }) => {
  await page.goto('./');
  await waitForPuzzle(page);
  await waitSaved(page);
  const names = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  expect(names).toContain('numception:app.numception.playtest');
});

test('a reload mid-round restores the same puzzle and solved cells, and the first frame is that puzzle', async ({ page }) => {
  await page.goto('./');
  const first = await waitForPuzzle(page);
  const answers = [answerCell(first).text];
  const second = await solve(page);
  answers.push(answerCell(second).text);
  const before = await solve(page);
  expect(before.nodeId).toEqual({ tier: 1, index: 2 });
  expect(before.context?.parent.cells.filter((c) => c.state === 'solved').map((c) => c.text)).toEqual(answers);
  await waitSaved(page, 3);

  await page.reload();
  const after = await waitForPuzzle(page);
  expect(after).toEqual(before);
  const mounted = await page.evaluate(() => (window as unknown as { __numception: SaveHook }).__numception.mountedView());
  expect(mounted).toEqual(before);
  expect(mounted?.kind).toBe('puzzle');
  // The restored round plays on.
  const next = await solve(page);
  expect(next.nodeId).toEqual({ tier: 2, index: 0 });
  expect(next.cells.map((c) => c.text)).toEqual([...answers, answerCell(before).text]);
});

test('backgrounding mid-beat completes the beat and pauses; on return the board is veiled and the first tap only unblurs', async ({ page }) => {
  await page.goto('./');
  const first = await waitForPuzzle(page);
  const clearInk = (await frameInk(page)).ink;
  const written = (await saves(page))?.written ?? 0;

  // The answer tap and the backgrounding in one task: the page hides during the solve beat.
  await page.evaluate((point) => {
    type H = { pagePoint(p: number[]): number[] | null };
    const at = (window as unknown as { __numception: H }).__numception.pagePoint(point);
    const canvas = document.querySelector('#app canvas');
    if (at === null || canvas === null) throw new Error('no canvas');
    for (const type of ['pointerdown', 'pointerup']) {
      canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, isPrimary: true, button: 0, pointerId: 1, pointerType: 'mouse', clientX: at[0], clientY: at[1] }));
    }
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, answerCell(first).labelPoint);

  expect(await solvedCount(page)).toBe(1);
  expect(await pauseReasons(page)).toEqual(['blur', 'lifecycle']);
  const paused = await view(page);
  expect(paused).toMatchObject({ nodeId: { tier: 1, index: 1 }, inputLocked: false, blurred: true, presentation: { kind: 'idle' } });
  await waitSaved(page, written + 1);
  // Tick has stopped: nothing moves while hidden.
  await page.waitForTimeout(300);
  expect(await view(page)).toEqual(paused);

  await setVisibility(page, 'visible');
  expect(await pauseReasons(page)).toEqual(['blur']);
  const veiled = await view(page);
  expect(veiled.blurred).toBe(true);
  await expect.poll(async () => (await frameInk(page)).ink).toBeLessThan(clearInk / 2);

  // The first tap, even on the answer, only lifts the veil.
  await clickUnit(page, answerCell(veiled).labelPoint);
  await expect.poll(async () => (await view(page)).blurred).toBe(false);
  expect(await solvedCount(page)).toBe(1);
  const log = await eventLog(page);
  expect(log.at(-1)?.type).toBe('BlurCleared');
  expect(await pauseReasons(page)).toEqual([]);
  const unveiled = await waitIdle(page);
  expect(unveiled.nodeId).toEqual({ tier: 1, index: 1 });
  await expect.poll(async () => (await frameInk(page)).ink).toBeGreaterThan(clearInk / 2);

  // Play goes on with the next tap.
  const next = await solve(page);
  expect(next.nodeId).toEqual({ tier: 1, index: 2 });
});

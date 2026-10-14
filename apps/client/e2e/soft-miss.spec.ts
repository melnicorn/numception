import { expect, type Page, test } from '@playwright/test';
import { clickUnit, events, pageOf, roleCell, roles, solve, solvedCount, view, waitForPuzzle, waitIdle } from './play-helpers';

// − rounds and the soft miss (FR-4) on the playtest build: rounds 0..3 are Classic +,
// Tower +, Classic −, Tower −. In a − puzzle (a − b = c, answer c), tapping b is a
// soft miss: a pulse and a ghost arrow, never a wrong tap, and "Tap the answer"
// once per profile, in the DOM guide-line slot.

const GUIDE = 'Tap the answer';

type SaveHook = { saves(): { written: number; busy: boolean } | null };

async function written(page: Page): Promise<number> {
  return (await page.evaluate(() => (window as unknown as { __numception: SaveHook }).__numception.saves()))?.written ?? 0;
}

/** Waits until the writer has written more than `before` snapshots and has nothing in flight. */
async function waitSavedAfter(page: Page, before: number): Promise<void> {
  await expect
    .poll(async () => {
      const s = await page.evaluate(() => (window as unknown as { __numception: SaveHook }).__numception.saves());
      return s !== null && !s.busy && s.written > before;
    })
    .toBe(true);
}

/** Plays rounds 0 (Classic +, 4 puzzles) and 1 (Tower +, 13) to reach round 2, Classic −. */
async function reachSubRound(page: Page): Promise<void> {
  for (let k = 0; k < 17; k += 1) await solve(page);
  expect((await roles(page))?.operator).toBe('sub');
}

async function softMissCount(page: Page): Promise<number> {
  return (await events(page)).filter((t) => t === 'SoftMiss').length;
}

test('a soft miss in a − round pulses and points to the answer, keeps the puzzle unsolved, and shows the guide line once per profile', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForPuzzle(page);
  const guide = page.getByRole('status');
  await expect(guide).toHaveText('');
  await expect(guide).toHaveAttribute('aria-live', 'polite');

  // In a + puzzle, b is just a wrong tap.
  await clickUnit(page, (await roleCell(page, 'b')).labelPoint);
  await expect.poll(() => events(page)).toContain('WrongTap');
  expect((await view(page)).softMiss).toBeUndefined();
  expect(await softMissCount(page)).toBe(0);

  await reachSubRound(page);
  const before = await waitIdle(page);
  expect(before.operator.symbol).toBe('−');
  const solved = await solvedCount(page);
  const b = await roleCell(page, 'b');
  const answer = await roleCell(page, 'c');

  await clickUnit(page, b.labelPoint);
  await expect.poll(() => softMissCount(page)).toBe(1);
  const cued = await view(page);
  expect(cued.softMiss).toMatchObject({ cellIndex: b.index, answerIndex: answer.index });
  expect(cued.inputLocked).toBe(false);
  expect(cued.nodeId).toEqual(before.nodeId);
  expect(cued.cells).toEqual(before.cells);
  expect(await solvedCount(page)).toBe(solved);
  expect(cued.guideLine).toBe(GUIDE);
  await expect(guide).toHaveText(GUIDE);
  // The line sits above the board, never over a cell.
  const line = await guide.boundingBox();
  const cellTop = Math.min(...(await Promise.all(cued.cells.flatMap((c) => c.polygon).map(async (p) => (await pageOf(page, p))[1]))));
  expect(line !== null && line.y + line.height <= cellTop).toBe(true);
  // The cue runs out by itself; the line stays until the next correct tap.
  await expect.poll(async () => (await view(page)).softMiss).toBeUndefined();
  await expect(guide).toHaveText(GUIDE);

  // The correct tap solves as usual and takes the line down.
  await clickUnit(page, answer.labelPoint);
  await expect.poll(() => solvedCount(page)).toBe(solved + 1);
  await expect(guide).toHaveText('');
  await waitIdle(page);

  // A second soft miss: the pulse and arrow only.
  const savedBefore = await written(page);
  await clickUnit(page, (await roleCell(page, 'b')).labelPoint);
  await expect.poll(() => softMissCount(page)).toBe(2);
  expect((await view(page)).softMiss).toBeDefined();
  expect((await view(page)).guideLine).toBeUndefined();
  await expect(guide).toHaveText('');

  // After a reload the profile still has seen the line: no guide line on the next soft miss.
  await waitSavedAfter(page, savedBefore);
  await page.reload();
  await waitForPuzzle(page);
  expect((await roles(page))?.operator).toBe('sub');
  await clickUnit(page, (await roleCell(page, 'b')).labelPoint);
  await expect.poll(() => softMissCount(page)).toBe(1);
  expect((await view(page)).softMiss).toBeDefined();
  expect((await view(page)).guideLine).toBeUndefined();
  await expect(page.getByRole('status')).toHaveText('');
});

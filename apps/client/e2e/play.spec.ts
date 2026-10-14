import { expect, test } from '@playwright/test';
import { answerCell, clickUnit, eventLog, events, solve, solvedCount, view, waitForPuzzle, waitIdle } from './play-helpers';

// The play-loop tracer on the playtest build (playwright.config.ts serves FLAVOUR=playtest):
// a tap travels render -> app -> core -> app -> render.

test('carries the playtest flavour identity', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Numception Playtest');
  await expect(page.locator('meta[name="numception-app-id"]')).toHaveAttribute('content', 'app.numception.playtest');
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'Numception Playtest');
  await expect(page.locator('html')).toHaveAttribute('data-flavour', 'playtest');
});

test('opens straight onto a Classic n = 3 + puzzle on a canvas, with no other UI but the dev-panel button', async ({ page }) => {
  await page.goto('./');
  const first = await waitForPuzzle(page);
  expect(first.nodeId).toEqual({ tier: 1, index: 0 });
  expect(first.shapeId).toBe('3A');
  expect(first.operator.symbol).toBe('+');
  expect(first.cells).toHaveLength(3);
  for (const cell of first.cells) {
    expect(cell.text).toMatch(/^\d+$/);
    expect(cell.state).toBe('unsolved');
  }
  answerCell(first);

  const canvas = page.locator('#app canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport && box.width * box.height > 0.8 * viewport.width * viewport.height).toBe(true);
  expect(await page.locator('#app').evaluate((el) => el.textContent ?? '')).toBe('');
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Dev panel' })).toBeVisible();
});

test('a tap on the answer shows the next puzzle; the operator centre and a wrong cell change nothing', async ({ page }) => {
  await page.goto('./');
  const first = await waitForPuzzle(page);

  await clickUnit(page, first.operator.labelPoint);
  const wrong = first.cells.find((c) => c.index !== answerCell(first).index);
  if (wrong === undefined) throw new Error('no wrong cell');
  await clickUnit(page, wrong.labelPoint);
  await expect.poll(() => events(page)).toContain('WrongTap');
  expect(await view(page)).toEqual(first);
  expect(await solvedCount(page)).toBe(0);
  // The operator dispatched nothing: only the wrong cell's tap reached core.
  expect((await events(page)).filter((t) => t !== 'ProfileCreated' && t !== 'RoundStarted')).toEqual(['WrongTap']);

  // A right-click on the answer is not a tap.
  const at = await page.evaluate((p) => (window as unknown as { __numception: { pagePoint(q: number[]): number[] } }).__numception.pagePoint(p), answerCell(first).labelPoint);
  await page.mouse.click(at[0] ?? 0, at[1] ?? 0, { button: 'right' });
  await page.waitForTimeout(100);
  expect(await view(page)).toEqual(first);
  expect(await solvedCount(page)).toBe(0);

  const second = await solve(page);
  expect(second.nodeId).toEqual({ tier: 1, index: 1 });
});

test('three solves lead to the tier-2 puzzle of their answers, and solving it starts a new round', async ({ page }) => {
  await page.goto('./');
  await waitForPuzzle(page);
  const answers: string[] = [];
  for (let leaf = 0; leaf < 3; leaf += 1) {
    const v = await view(page);
    expect(v.nodeId).toEqual({ tier: 1, index: leaf });
    answers.push(answerCell(v).text);
    await solve(page);
  }
  const top = await view(page);
  expect(top.nodeId).toEqual({ tier: 2, index: 0 });
  expect(top.cells.map((c) => c.text)).toEqual(answers);
  expect(top.cells.every((c) => c.state === 'solved')).toBe(true);

  const next = await solve(page);
  expect(await events(page)).toContain('RoundCompleted');
  // Round 1 is a Tower: its first leaf, under tier 2 and the top.
  expect(next.nodeId).toEqual({ tier: 1, index: 0 });
  expect(next.cells.every((c) => c.state === 'unsolved')).toBe(true);
});

test('a tap during the solve beat is dropped: the board is locked until the beat ends', async ({ page }) => {
  await page.goto('./');
  const first = await waitForPuzzle(page);
  const answer = answerCell(first);
  // Both taps go to the canvas in one synchronous task, so no frame (and no Tick)
  // can run between them: the second one always lands during the solve beat.
  const locked = await page.evaluate((point) => {
    type H = { view(): { inputLocked: boolean; presentation: { kind: string } } | null; pagePoint(p: number[]): number[] | null };
    const hook = (window as unknown as { __numception: H }).__numception;
    const at = hook.pagePoint(point);
    const canvas = document.querySelector('#app canvas');
    if (at === null || canvas === null) throw new Error('no canvas');
    const tap = () => {
      for (const type of ['pointerdown', 'pointerup']) {
        canvas.dispatchEvent(
          new PointerEvent(type, { bubbles: true, isPrimary: true, button: 0, pointerId: 1, pointerType: 'mouse', clientX: at[0], clientY: at[1] }),
        );
      }
    };
    tap();
    const afterFirst = hook.view();
    tap();
    return afterFirst;
  }, answer.labelPoint);
  expect(locked?.inputLocked).toBe(true);
  expect(locked?.presentation.kind).toBe('solve');
  expect(await solvedCount(page)).toBe(1);
  const next = await waitIdle(page);
  expect(next.nodeId).toEqual({ tier: 1, index: 1 });
  expect(await solvedCount(page)).toBe(1);
});

test('round 1 is a Tower: 9, then 3, then 1 puzzles, collapsing after each group and tier, into round 2 Classic', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('./');
  await waitForPuzzle(page);
  // Round 0, Classic: three leaves and the top.
  for (let k = 0; k < 4; k += 1) await solve(page);
  const towerStart = (await eventLog(page)).length;
  const order: string[] = [];
  for (let k = 0; k < 13; k += 1) {
    const v = await view(page);
    order.push(`${v.nodeId.tier}.${v.nodeId.index}`);
    await solve(page);
  }
  expect(order).toEqual(['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '2.0', '2.1', '2.2', '3.0']);
  const tower = (await eventLog(page)).slice(towerStart);
  expect(tower.filter((e) => e.type === 'RoundCollapsed').map((e) => `${e.nodeId?.tier}.${e.nodeId?.index}`)).toEqual(['2.0', '2.1', '2.2', '3.0']);
  expect(tower.filter((e) => e.type === 'RoundCompleted').map((e) => e.roundOrdinal)).toEqual([1]);
  expect(tower.filter((e) => e.type === 'RoundStarted').map((e) => e.roundOrdinal)).toEqual([2]);
  // Round 2 is Classic again: its first leaf sits under a tier-2 top.
  const next = await view(page);
  expect(next.nodeId).toEqual({ tier: 1, index: 0 });
  expect(next.kind).toBe('puzzle');
  expect(next.cells.every((c) => c.state === 'unsolved')).toBe(true);
});

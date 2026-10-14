import { expect, test } from '@playwright/test';
import {
  answerCell,
  clickUnit,
  eventLog,
  events,
  frameInk,
  pageOf,
  parentToView,
  pixelAt,
  regionInk,
  solve,
  solvedCount,
  view,
  waitBeat,
  waitForPuzzle,
  waitIdle,
} from './play-helpers';

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

test('the solve, collapse and round crossfade are drawn: mid-beat frames carry from/to views and are not blank', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./');
  await waitForPuzzle(page);
  const idle = await frameInk(page);
  expect(idle.ink).toBeGreaterThan(0.05);

  // Solve: the tapped answer fires at once.
  const first = await view(page);
  await clickUnit(page, answerCell(first).labelPoint);
  const solving = await waitBeat(page, 'solve', 0, 1);
  expect(solving.presentation.cellIndex).toBe(answerCell(first).index);
  await waitIdle(page);
  await solve(page);

  // The third leaf's solve collapses the round into the tier-2 puzzle: the first
  // collapse is the long one, so the frame is sampled well inside it.
  const third = await view(page);
  await clickUnit(page, answerCell(third).labelPoint);
  const collapsing = await waitBeat(page, 'collapse', 0.15, 0.6);
  expect(collapsing.presentation.durationMs).toBe(3000);
  expect(collapsing.presentation.from?.nodeId).toEqual({ tier: 1, index: 2 });
  expect(collapsing.presentation.from?.solvedAnswer).not.toBeNull();
  expect(collapsing.presentation.to?.nodeId).toEqual({ tier: 2, index: 0 });
  expect(collapsing.presentation.camera?.from.width).toBeLessThan(collapsing.presentation.camera?.to.width ?? 0);
  // The pull-out starts on the child's parent framing (entry 9): the parent it collapses into.
  expect(collapsing.presentation.from?.context?.parent.nodeId).toEqual({ tier: 2, index: 0 });
  expect(collapsing.presentation.camera?.from).toEqual(collapsing.presentation.from?.context?.camera);
  const mid = await frameInk(page);
  expect(mid.ink).toBeGreaterThan(0.1);
  expect(mid.fired).toBeGreaterThan(0.02);
  const top = await waitIdle(page);
  expect(top.nodeId).toEqual({ tier: 2, index: 0 });

  // The top's solve crossfades into the next round.
  await clickUnit(page, answerCell(top).labelPoint);
  const crossfading = await waitBeat(page, 'roundStart', 0, 1);
  expect(crossfading.presentation.from?.nodeId).toEqual({ tier: 2, index: 0 });
  expect(crossfading.presentation.to?.nodeId).toEqual({ tier: 1, index: 0 });
  expect(crossfading.presentation.camera).toBeUndefined();
  // Second half of the crossfade: only the new round is drawn. The old top fused
  // into the solved fill (#A14E36) must not show through the new operator's faint
  // wash; sampled half-way between the operator's centre (its + glyph) and a corner.
  const late = await waitBeat(page, 'roundStart', 0.55, 0.95);
  const corner = late.operator.polygon[0] ?? late.operator.labelPoint;
  const probe: [number, number] = [(late.operator.labelPoint[0] + corner[0]) / 2, (late.operator.labelPoint[1] + corner[1]) / 2];
  const probeAt = await page.evaluate((p) => (window as unknown as { __numception: { pagePoint(q: number[]): number[] } }).__numception.pagePoint(p), probe);
  const [lateFrame, operatorPixel] = await Promise.all([frameInk(page), pixelAt(page, [probeAt[0] ?? 0, probeAt[1] ?? 0])]);
  expect(lateFrame.ink).toBeGreaterThan(0.05);
  const solvedFill = [0xa1, 0x4e, 0x36];
  const distance = Math.max(...operatorPixel.map((c, i) => Math.abs(c - (solvedFill[i] ?? 0))));
  expect(distance, `operator region ${operatorPixel.join(',')}`).toBeGreaterThan(40);
  const next = await waitIdle(page);
  expect(next.presentation.from).toBeUndefined();
});

test('a puzzle sits inside its parent: the parent outline and siblings are drawn around it, and taps there do nothing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const first = await waitForPuzzle(page);
  expect(first.context?.parent.nodeId).toEqual({ tier: 2, index: 0 });
  expect(first.context?.parent.kind).toBe('overview');
  expect(first.context?.cellIndex).toBe(0);

  // Ink outside the puzzle's cell: the strip below the puzzle's base holds the
  // parent's outline and its lower cells.
  const base = await pageOf(page, [0.5, 0.75]);
  const strip = { x: 0, y: base[1] + 6, width: 390, height: Math.min(200, 844 - base[1] - 12) };
  expect(strip.height).toBeGreaterThan(40);
  expect(await regionInk(page, strip)).toBeGreaterThan(0.002);

  // Taps on a sibling cell and on the parent's operator dispatch nothing.
  const before = await eventLog(page);
  const parent = first.context?.parent;
  if (parent === undefined) throw new Error('no parent');
  const targets = [parent.cells[1]?.labelPoint, parent.cells[2]?.labelPoint, parent.operator.labelPoint];
  for (const target of targets) {
    if (target === undefined) throw new Error('no target');
    const at = await pageOf(page, parentToView(first, target));
    expect(at[0]).toBeGreaterThan(0);
    expect(at[0]).toBeLessThan(390);
    expect(at[1]).toBeLessThan(844);
    // Not inside the puzzle in view: below its base.
    expect(at[1]).toBeGreaterThan(base[1]);
    await page.mouse.click(at[0], at[1]);
  }
  await page.waitForTimeout(150);
  expect(await eventLog(page)).toEqual(before);
  expect(await view(page)).toEqual(first);

  // The answer still works; the next leaf fills the next cell, its solved sibling showing its answer.
  const next = await solve(page);
  expect(next.nodeId).toEqual({ tier: 1, index: 1 });
  expect(next.context?.cellIndex).toBe(1);
  expect(next.context?.parent.cells[0]?.text).toBe(answerCell(first).text);
  expect(next.context?.parent.cells[0]?.state).toBe('solved');
});

test('context loss events pause drawing, and the restore rebuilds the scene from the latest view', async ({ page }) => {
  await page.goto('./');
  await waitForPuzzle(page);
  type Stats = { framesRendered: number; rebuilds: number };
  const stats = () => page.evaluate(() => (window as unknown as { __numception: { renderStats(): Stats } }).__numception.renderStats());
  // Synthetic events on a live context drive the renderer's own lost/restored path
  // (headless WebKit never fires a real webglcontextrestored, see the next test).
  const during = await page.evaluate(async () => {
    const hook = (window as unknown as { __numception: { renderStats(): Stats } }).__numception;
    const canvas = document.querySelector('#app canvas');
    if (canvas === null) throw new Error('no canvas');
    const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await frames();
    const before = hook.renderStats();
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    const atLoss = hook.renderStats();
    await frames();
    const whileLost = hook.renderStats();
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    const atRestore = hook.renderStats();
    await frames();
    return { before, atLoss, whileLost, atRestore, after: hook.renderStats() };
  });
  expect(during.before.framesRendered).toBeGreaterThan(0);
  // No frame is rendered between lost and restored.
  expect(during.whileLost.framesRendered).toBe(during.atLoss.framesRendered);
  // The restore rebuilds once, and frames resume.
  expect(during.atRestore.rebuilds).toBe(during.before.rebuilds + 1);
  expect(during.after.framesRendered).toBeGreaterThan(during.whileLost.framesRendered);
  expect((await stats()).rebuilds).toBe(during.before.rebuilds + 1);
  const frame = await frameInk(page);
  expect(frame.ink).toBeGreaterThan(0.05);
  const next = await solve(page);
  expect(next.nodeId).toEqual({ tier: 1, index: 1 });
});

test('a real lost WebGL context is rebuilt from the latest view once restored', async ({ page }) => {
  await page.goto('./');
  await waitForPuzzle(page);
  const restored = await page.evaluate(async () => {
    const canvas = document.querySelector('#app canvas') as HTMLCanvasElement | null;
    const gl = (canvas?.getContext('webgl2') ?? canvas?.getContext('webgl')) as WebGLRenderingContext | null;
    const lose = gl?.getExtension('WEBGL_lose_context');
    if (canvas === null || lose == null) return 'unsupported';
    // Resolves on the event, or false after 3 s.
    const wait = (type: string) =>
      new Promise<boolean>((resolve) => {
        canvas.addEventListener(type, () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 3000);
      });
    const lost = wait('webglcontextlost');
    lose.loseContext();
    if (!(await lost)) return 'unsupported';
    const back = wait('webglcontextrestored');
    lose.restoreContext();
    if (!(await back)) return 'unsupported';
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return 'restored';
  });
  test.skip(restored === 'unsupported', 'this browser cannot lose and restore a WebGL context on demand');
  const frame = await frameInk(page);
  expect(frame.ink).toBeGreaterThan(0.05);
  const next = await solve(page);
  expect(next.nodeId).toEqual({ tier: 1, index: 1 });
});

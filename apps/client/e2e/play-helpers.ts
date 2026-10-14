import { expect, type Page } from '@playwright/test';

// Reads the game through the dev/playtest test hook (apps/client/src/test-hook.ts);
// the hook is absent from prod (tools/check-flavours.mjs).

export type Point = [number, number];
export type CellView = { index: number; labelPoint: Point; text: string; state: 'unsolved' | 'solved' };
export type View = {
  nodeId: { tier: number; index: number };
  shapeId: string;
  cells: CellView[];
  operator: { labelPoint: Point; symbol: string };
};

type Hook = { view(): View | null; pagePoint(p: Point): Point | null; events(): { type: string }[] };

/** Waits until the canvas is mounted and the hook shows a puzzle; returns its view. */
export async function waitForPuzzle(page: Page): Promise<View> {
  await page.waitForFunction(() => {
    const hook = (window as unknown as { __numception?: Hook }).__numception;
    const view = hook?.view();
    return view != null && hook?.pagePoint(view.operator.labelPoint) != null;
  });
  return view(page);
}

export async function view(page: Page): Promise<View> {
  const v = await page.evaluate(() => (window as unknown as { __numception: Hook }).__numception.view());
  expect(v).not.toBeNull();
  return v as View;
}

export async function events(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __numception: Hook }).__numception.events().map((e) => e.type));
}

/** Clicks a unit-box point of the current view. */
export async function clickUnit(page: Page, point: Point): Promise<void> {
  const at = await page.evaluate((p) => (window as unknown as { __numception: Hook }).__numception.pagePoint(p), point);
  expect(at).not.toBeNull();
  await page.mouse.click(at?.[0] ?? 0, at?.[1] ?? 0);
}

/** The answer cell of a + puzzle: the one whose value is the sum of the others. */
export function answerCell(v: View): CellView {
  const values = v.cells.map((c) => Number(c.text));
  const total = values.reduce((a, b) => a + b, 0);
  const answer = v.cells.find((c) => Number(c.text) * 2 === total);
  expect(answer, `no answer among ${values.join(', ')}`).toBeDefined();
  return answer as CellView;
}

/** How many `PuzzleSolved` events the hook has seen. */
export async function solvedCount(page: Page): Promise<number> {
  return (await events(page)).filter((t) => t === 'PuzzleSolved').length;
}

/** Taps the answer of the puzzle in view, waits for core's `PuzzleSolved`, and returns the next view. */
export async function solve(page: Page): Promise<View> {
  const before = await solvedCount(page);
  await clickUnit(page, answerCell(await view(page)).labelPoint);
  await expect.poll(() => solvedCount(page)).toBe(before + 1);
  return view(page);
}

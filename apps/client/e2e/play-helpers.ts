import { expect, type Page } from '@playwright/test';

// Reads the game through the dev/playtest test hook (apps/client/src/test-hook.ts);
// the hook is absent from prod (tools/check-flavours.mjs).

export type Point = [number, number];
export type NodeId = { tier: number; index: number };
export type CellView = { index: number; labelPoint: Point; text: string; state: 'unsolved' | 'solved'; enters: NodeId | null };
export type View = {
  nodeId: NodeId;
  kind: 'puzzle' | 'overview';
  shapeId: string;
  cells: CellView[];
  operator: { polygon: Point[]; labelPoint: Point; symbol: string };
  solvedAnswer: number | null;
  inputLocked: boolean;
  presentation: {
    kind: string;
    progress: number;
    durationMs: number;
    cellIndex: number | null;
    from?: View;
    to?: View;
    camera?: { from: Rect; to: Rect };
  };
};

export type Rect = { x: number; y: number; width: number; height: number };

export type HookEvent = { type: string; nodeId?: NodeId; roundOrdinal?: number };

type Hook = { view(): View | null; pagePoint(p: Point): Point | null; events(): HookEvent[] };

/** Every event the hook has seen, in full. */
export async function eventLog(page: Page): Promise<HookEvent[]> {
  return page.evaluate(() => (window as unknown as { __numception: Hook }).__numception.events());
}

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

/** Waits out the running presentation beats (the scheduler's Ticks end them) and returns the idle view. */
export async function waitIdle(page: Page): Promise<View> {
  await page.waitForFunction(() => (window as unknown as { __numception: Hook }).__numception.view()?.inputLocked === false, undefined, {
    timeout: 15_000,
  });
  return view(page);
}

/**
 * Taps the answer of the puzzle in view, waits for core's `PuzzleSolved`, waits out
 * the solve, collapse, advance and round-start beats, and returns the next idle view.
 */
export async function solve(page: Page): Promise<View> {
  const v = await waitIdle(page);
  expect(v.kind).toBe('puzzle');
  const before = await solvedCount(page);
  await clickUnit(page, answerCell(v).labelPoint);
  await expect.poll(() => solvedCount(page)).toBe(before + 1);
  return waitIdle(page);
}

/**
 * Screenshots the canvas and reports how much of it is not bare surface: the share
 * of pixels away from the Kiln surface colour, and the share near the fired-tile
 * colour (`cell-solved`). A blank frame scores 0 on both.
 */
export async function frameInk(page: Page): Promise<{ ink: number; fired: number }> {
  const png = await page.locator('#app canvas').screenshot();
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('no 2d context');
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const near = (i: number, rgb: number[], tolerance: number) =>
      Math.abs((data[i] ?? 0) - (rgb[0] ?? 0)) <= tolerance &&
      Math.abs((data[i + 1] ?? 0) - (rgb[1] ?? 0)) <= tolerance &&
      Math.abs((data[i + 2] ?? 0) - (rgb[2] ?? 0)) <= tolerance;
    let ink = 0;
    let fired = 0;
    const pixels = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      if (!near(i, [0xec, 0xe3, 0xd7], 12)) ink += 1;
      if (near(i, [0xa1, 0x4e, 0x36], 16)) fired += 1;
    }
    return { ink: ink / pixels, fired: fired / pixels };
  }, png.toString('base64'));
}

/** Waits until the view is in a `kind` beat with progress inside `[min, max]`; returns it. */
export async function waitBeat(page: Page, kind: string, min: number, max: number): Promise<View> {
  await page.waitForFunction(
    ([k, lo, hi]) => {
      const p = (window as unknown as { __numception: Hook }).__numception.view()?.presentation;
      return p?.kind === k && p.progress >= (lo as number) && p.progress <= (hi as number);
    },
    [kind, min, max] as const,
    { timeout: 15_000, polling: 'raf' },
  );
  return view(page);
}

/** The colour of the page at page point `at` (CSS px), from a screenshot, as [r, g, b]. */
export async function pixelAt(page: Page, at: Point): Promise<[number, number, number]> {
  const png = await page.screenshot({ scale: 'css' });
  return page.evaluate(
    async ([base64, x, y]) => {
      const bytes = Uint8Array.from(atob(base64 as string), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx === null) throw new Error('no 2d context');
      ctx.drawImage(bitmap, 0, 0);
      const d = ctx.getImageData(Math.round(x as number), Math.round(y as number), 1, 1).data;
      return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0] as [number, number, number];
    },
    [png.toString('base64'), at[0], at[1]] as const,
  );
}

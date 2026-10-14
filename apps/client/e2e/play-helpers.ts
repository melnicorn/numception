import { expect, type Page } from '@playwright/test';

// Reads the game through the dev/playtest test hook (apps/client/src/test-hook.ts);
// the hook is absent from prod (tools/check-flavours.mjs).

export type Point = [number, number];
export type NodeId = { tier: number; index: number };
export type CellView = { index: number; polygon: Point[]; labelPoint: Point; text: string; state: 'unsolved' | 'solved'; enters: NodeId | null };
/** The theme tokens the view is drawn in (AD-15), as far as the specs read them. */
export type Theme = { themeId: string; mode: string; surface: string; solvedFill: string; cellFill: string; line: string; number: string };

export type View = {
  nodeId: NodeId;
  theme: Theme;
  kind: 'puzzle' | 'overview';
  shapeId: string;
  cells: CellView[];
  operator: { polygon: Point[]; labelPoint: Point; symbol: string };
  solvedAnswer: number | null;
  inputLocked: boolean;
  /** The board is veiled after a lifecycle pause (AD-17). */
  blurred: boolean;
  presentation: {
    kind: string;
    progress: number;
    durationMs: number;
    cellIndex: number | null;
    from?: View;
    to?: View;
    camera?: { from: Rect; to: Rect; fromBox: Rect };
  };
  /** The parent drawn around the puzzle (entry 9); absent at the round's top. */
  context?: { parent: View; cellIndex: number; camera: Rect };
  /** The soft-miss cue while it runs (FR-4). */
  softMiss?: { cellIndex: number; answerIndex: number; progress: number };
  /** The guide line text while up (DOM, not canvas). */
  guideLine?: string;
};

export type Rect = { x: number; y: number; width: number; height: number };

export type HookEvent = { type: string; nodeId?: NodeId; roundOrdinal?: number };

/** The puzzle in view's roles (test hook): a + b = c or a − b = c; c is the answer, b the − soft-miss cell. */
export type Roles = { operator: 'add' | 'sub'; a: number; b: number; c: number; answerIndex: number };

type Hook = { view(): View | null; pagePoint(p: Point): Point | null; events(): HookEvent[]; roles(): Roles | null };

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

/** The puzzle in view's roles, from the test hook (null on an overview). */
export async function roles(page: Page): Promise<Roles | null> {
  return page.evaluate(() => (window as unknown as { __numception: Hook }).__numception.roles());
}

/** The cell of the puzzle in view with role `role` (default the answer, c), by the hook's answer index; works for + and −. */
export async function roleCell(page: Page, role: 'a' | 'b' | 'c' = 'c'): Promise<CellView> {
  const [r, v] = await Promise.all([roles(page), view(page)]);
  expect(r, 'no puzzle in view').not.toBeNull();
  const cell = v.cells[role === 'c' ? (r as Roles).answerIndex : (r as Roles)[role]];
  expect(cell, `no ${role} cell`).toBeDefined();
  return cell as CellView;
}

/** The answer cell of the puzzle in view. */
export async function answerCell(page: Page): Promise<CellView> {
  return roleCell(page, 'c');
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
  await clickUnit(page, (await answerCell(page)).labelPoint);
  await expect.poll(() => solvedCount(page)).toBe(before + 1);
  return waitIdle(page);
}

/** `#RRGGBB` as [r, g, b]. */
export function rgbOf(color: string): [number, number, number] {
  const v = Number.parseInt(color.slice(1), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

/** The largest channel difference between two colours. */
export function colorDistance(a: readonly number[], b: readonly number[]): number {
  return Math.max(...a.map((c, i) => Math.abs(c - (b[i] ?? 0))));
}

/**
 * Screenshots the canvas and reports how much of it is not bare surface: the share
 * of pixels away from the surface colour, and the share near the fired-tile colour
 * (`cell-solved`), both of `theme` (default: the theme of the view in now). A
 * blank frame scores 0 on both.
 */
export async function frameInk(page: Page, theme?: Theme): Promise<{ ink: number; fired: number }> {
  const t = theme ?? (await view(page)).theme;
  const png = await page.locator('#app canvas').screenshot();
  return page.evaluate(async ([base64, surface, solved]) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('no 2d context');
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const near = (i: number, rgb: readonly number[], tolerance: number) =>
      Math.abs((data[i] ?? 0) - (rgb[0] ?? 0)) <= tolerance &&
      Math.abs((data[i + 1] ?? 0) - (rgb[1] ?? 0)) <= tolerance &&
      Math.abs((data[i + 2] ?? 0) - (rgb[2] ?? 0)) <= tolerance;
    let ink = 0;
    let fired = 0;
    const pixels = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      if (!near(i, surface, 12)) ink += 1;
      if (near(i, solved, 16)) fired += 1;
    }
    return { ink: ink / pixels, fired: fired / pixels };
  }, [png.toString('base64'), rgbOf(t.surface), rgbOf(t.solvedFill)] as const);
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

/** The bounding box of `points`. */
export function boundsOf(points: Point[]): Rect {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/**
 * A point of the view's context parent (its unit box) in the view's own unit box,
 * for `pagePoint`: the view's whole shape box sits on its parent cell's bounding
 * box (3A cells become the child, aspect 1), centred and fitted.
 */
export function parentToView(v: View, point: Point): Point {
  const context = v.context;
  if (context === undefined) throw new Error('no context');
  const cell = boundsOf(context.parent.cells[context.cellIndex]?.polygon ?? []);
  const own = boundsOf([...v.cells.flatMap((c) => c.polygon), ...v.operator.polygon]);
  const k = Math.min(cell.width / own.width, cell.height / own.height);
  const cx = cell.x + cell.width / 2;
  const cy = cell.y + cell.height / 2;
  return [own.x + own.width / 2 + (point[0] - cx) / k, own.y + own.height / 2 + (point[1] - cy) / k];
}

/** The share of pixels in page rect `clip` (CSS px) that are away from the surface colour of the view in now. */
export async function regionInk(page: Page, clip: Rect): Promise<number> {
  const surface = rgbOf((await view(page)).theme.surface);
  const png = await page.screenshot({ clip, scale: 'css' });
  return page.evaluate(async ([base64, [r, g, b]]) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('no 2d context');
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      const off = Math.max(Math.abs((data[i] ?? 0) - r), Math.abs((data[i + 1] ?? 0) - g), Math.abs((data[i + 2] ?? 0) - b));
      if (off > 12) ink += 1;
    }
    return ink / (data.length / 4);
  }, [png.toString('base64'), surface] as const);
}

/** A unit-box point of the current view in page coordinates. */
export async function pageOf(page: Page, point: Point): Promise<Point> {
  const at = await page.evaluate((p) => (window as unknown as { __numception: Hook }).__numception.pagePoint(p), point);
  expect(at).not.toBeNull();
  return at as Point;
}

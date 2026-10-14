import { expect, type Page, test } from '@playwright/test';

// The dev panel's round inspector in the playtest build (epic Done-when 6): plans
// Classic and Tower rounds from the bundled tunings, and keeps working offline.

type Line = { label: string; tier: number; index: number; contract: string | undefined; cells: string[]; answer: string };

/** Parses `t<tier>.<index>[ =<contract>]: <cells, answer in brackets> · b<band>[ clamped] · <bucketId>`. */
function parseLine(text: string): Line {
  const m = text.match(/^t(\d+)\.(\d+)(?: =(\S+))?: (.+?) · b\d+(?: clamped)? · dm\d+\|\w+\|d\d+\|c\d+\|n\d+\|nm\d+$/);
  if (!m) throw new Error(`unexpected line: ${text}`);
  const cells = (m[4] ?? '').split(' ');
  const answers = cells.filter((c) => /^\[.+\]$/.test(c));
  expect(answers, text).toHaveLength(1);
  return {
    label: `t${m[1]}.${m[2]}`,
    tier: Number(m[1]),
    index: Number(m[2]),
    contract: m[3],
    cells: cells.map((c) => c.replace(/^\[|\]$/g, '')),
    answer: (answers[0] ?? '').slice(1, -1),
  };
}

async function openInspector(page: Page) {
  await page.getByRole('button', { name: 'Dev panel' }).click();
  const block = page.getByTestId('dev-round-inspector');
  await expect(block.getByRole('heading', { name: 'Round inspector' })).toBeVisible();
  return block;
}

/** Chooses the round, plans it and returns the output's line texts. */
async function plan(page: Page, choice: { type: 'Classic' | 'Tower'; n: number; operator: 'add' | 'sub' }): Promise<string[]> {
  const block = page.getByTestId('dev-round-inspector');
  await block.getByLabel('Type').selectOption({ label: choice.type });
  await block.getByLabel('n', { exact: true }).selectOption(String(choice.n));
  await block.getByLabel('Operator').selectOption(choice.operator);
  await block.getByRole('button', { name: 'Plan round' }).click();
  await expect(block.getByTestId('dev-round-error')).toHaveCount(0);
  await expect(block.getByTestId('dev-round-summary')).toBeVisible();
  return block.getByTestId('dev-round-line').allTextContents();
}

/** Every line below the top answers its parent's cell: cell j of (k, i) is child (k − 1, i·n + j). */
function expectContractsHold(texts: string[], n: number, topTier: number): void {
  const lines = texts.map(parseLine);
  const byLabel = new Map(lines.map((l) => [l.label, l]));
  for (const line of lines) {
    expect(line.cells).toHaveLength(n);
    if (line.tier === topTier) {
      expect(line.contract).toBeUndefined();
      continue;
    }
    const parent = byLabel.get(`t${line.tier + 1}.${Math.floor(line.index / n)}`);
    expect(parent, line.label).toBeDefined();
    expect(line.answer, line.label).toBe(parent?.cells[line.index % n]);
    expect(line.contract, line.label).toBe(line.answer);
  }
}

test('plans a Tower at n = 9 (sub): 91 lines whose answers equal their parent cells, the same after a reload', async ({ page }) => {
  await page.goto('./');
  await openInspector(page);
  const first = await plan(page, { type: 'Tower', n: 9, operator: 'sub' });
  expect(first).toHaveLength(91);
  const tiers = first.map((t) => parseLine(t).tier);
  expect(tiers.filter((t) => t === 3)).toHaveLength(1);
  expect(tiers.filter((t) => t === 2)).toHaveLength(9);
  expect(tiers.filter((t) => t === 1)).toHaveLength(81);
  expect(tiers).toEqual([...tiers].sort((a, b) => b - a));
  expectContractsHold(first, 9, 3);
  const summary = await page.getByTestId('dev-round-summary').textContent();
  expect(summary).toContain('91 puzzles');
  expect(summary).toContain('generator 1, difficulty model 1, tuning 1');

  await page.reload();
  await openInspector(page);
  expect(await plan(page, { type: 'Tower', n: 9, operator: 'sub' })).toEqual(first);
  expect(await page.getByTestId('dev-round-summary').textContent()).toBe(summary);
});

test('plans a Classic at n = 3: 4 lines', async ({ page }) => {
  await page.goto('./');
  await openInspector(page);
  const lines = await plan(page, { type: 'Classic', n: 3, operator: 'add' });
  expect(lines).toHaveLength(4);
  expectContractsHold(lines, 3, 2);

  // Changing any control clears the shown round until it is planned again.
  await page.getByTestId('dev-round-inspector').getByLabel('Type').selectOption({ label: 'Tower' });
  await expect(page.getByTestId('dev-round-output')).toHaveCount(0);
});

test('shows a bad seed as an error, without crashing', async ({ page }) => {
  await page.goto('./');
  const block = await openInspector(page);
  await block.getByLabel('Seed').fill('abc');
  await block.getByRole('button', { name: 'Plan round' }).click();
  await expect(block.getByTestId('dev-round-error')).toContainText('invalid-seed');
  await block.getByLabel('Seed').fill('20261011');
  await block.getByRole('button', { name: 'Plan round' }).click();
  await expect(block.getByTestId('dev-round-error')).toHaveCount(0);
  await expect(block.getByTestId('dev-round-line')).toHaveCount(4);
});

test('plans offline after one online load', async ({ page, context }) => {
  await page.goto('./');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 });

  await context.setOffline(true);
  try {
    await page.reload();
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    await openInspector(page);
    const lines = await plan(page, { type: 'Tower', n: 9, operator: 'sub' });
    expect(lines).toHaveLength(91);
    expectContractsHold(lines, 9, 3);
  } finally {
    await context.setOffline(false);
  }
});

test('keeps a Tower at n = 9 usable on a phone: the panel fits the viewport and scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('./');
  await openInspector(page);
  await plan(page, { type: 'Tower', n: 9, operator: 'sub' });
  const panel = page.getByTestId('dev-panel');
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.y ?? -1) >= 0 && (box?.x ?? -1) >= 0).toBe(true);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(667);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
  expect(await panel.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  const last = page.getByTestId('dev-round-line').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
});

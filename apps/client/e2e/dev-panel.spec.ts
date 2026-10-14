import { expect, test } from '@playwright/test';

// Playtest ships the dev panel shell (AD-18); prod's absence is checked on the
// built files by tools/check-flavours.mjs.

test('dev panel toggle opens and closes the empty panel', async ({ page }) => {
  await page.goto('./');
  const toggle = page.getByRole('button', { name: 'Dev panel' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('dev-panel')).toHaveCount(0);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const panel = page.getByTestId('dev-panel');
  await expect(panel).toBeVisible();
  await expect(page.getByRole('region', { name: 'Dev panel' })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Dev panel' })).toBeVisible();

  await toggle.click();
  await expect(panel).toHaveCount(0);
  // The game is unaffected.
  await expect(page.locator('#app canvas')).toBeVisible();
});

/** Opens the dev panel and reads the Puzzle block's cells (placement order) and answer position. */
async function readPuzzle(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Dev panel' }).click();
  const block = page.getByTestId('dev-puzzle');
  await expect(block).toBeVisible();
  await expect(block.getByRole('heading', { name: 'Puzzle' })).toBeVisible();
  await expect(block.getByTestId('dev-puzzle-error')).toHaveCount(0);
  const cells = block.getByTestId('dev-puzzle-cell');
  await expect(cells).toHaveCount(3);
  const texts = await cells.allTextContents();
  const answers = await cells.evaluateAll((els) => els.map((el) => el.getAttribute('data-answer')));
  return {
    seed: await block.getByTestId('dev-puzzle-seed').textContent(),
    n: await block.getByTestId('dev-puzzle-n').textContent(),
    operator: await block.getByTestId('dev-puzzle-operator').textContent(),
    versions: await block.getByTestId('dev-puzzle-versions').textContent(),
    values: texts.map((t) => Number(t.replace('(answer)', '').trim())),
    texts,
    answerIndex: answers.indexOf('true'),
    answerCount: answers.filter((a) => a === 'true').length,
  };
}

test('dev panel shows the seeded demo puzzle, the same after a reload', async ({ page }) => {
  await page.goto('./');
  const first = await readPuzzle(page);

  expect(first.seed).toMatch(/^\d+$/);
  expect(first.n).toBe('3');
  expect(first.operator).toContain('+');
  expect(first.versions).toBe('generator 1, difficulty model 1, tuning 1');
  expect(first.answerCount).toBe(1);
  expect(first.texts[first.answerIndex]).toContain('(answer)');
  for (const v of first.values) {
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(1);
  }
  expect(new Set(first.values).size).toBe(3);
  const others = first.values.filter((_, i) => i !== first.answerIndex);
  expect(first.values[first.answerIndex]).toBe((others[0] ?? 0) + (others[1] ?? 0));

  await page.reload();
  const second = await readPuzzle(page);
  expect(second).toEqual(first);
});

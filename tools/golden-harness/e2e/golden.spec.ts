import { expect, test } from '@playwright/test';

type GoldenReport = { fixtures: string[]; cases: number; plans: number; mismatches: string[] };

// AD-6: golden seeds and round plans reproduce identically in WebKit (the iOS engine) and Node.
test('every golden-seed case and round plan reproduces in WebKit', async ({ page }) => {
  await page.goto('./');
  const result = page.locator('#golden-result');
  await expect(result).not.toHaveAttribute('data-status', 'pending');
  const report = await page.evaluate(() => (window as unknown as { __goldenReport: GoldenReport }).__goldenReport);
  // The mismatches name each failing case; compared first so a failure lists them.
  expect(report.mismatches).toEqual([]);
  expect(report.fixtures).toContain('generator-v1.json');
  expect(report.cases).toBeGreaterThanOrEqual(90);
  expect(report.plans).toBeGreaterThanOrEqual(20);
  await expect(result).toHaveAttribute('data-status', 'pass');
});

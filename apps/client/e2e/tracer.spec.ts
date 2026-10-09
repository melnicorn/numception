import { expect, test } from '@playwright/test';

test('shows the tracer value computed in core', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('tracer-value')).toHaveText('5/6');
});

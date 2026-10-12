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
  // The tracer is unaffected.
  await expect(page.getByTestId('tracer-value')).toHaveText('5/6');
});

import { expect, test } from '@playwright/test';

// Runs against the playtest build (playwright.config.ts serves FLAVOUR=playtest).

test('shows the tracer value computed in core', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('tracer-value')).toHaveText('5/6');
});

test('carries the playtest flavour identity', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Numception Playtest');
  await expect(page.locator('meta[name="numception-app-id"]')).toHaveAttribute('content', 'app.numception.playtest');
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'Numception Playtest');
  await expect(page.locator('html')).toHaveAttribute('data-flavour', 'playtest');
});

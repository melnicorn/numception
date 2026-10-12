import { expect, test } from '@playwright/test';

// NFR-2: the playtest build (served by playwright.config.ts) plays fully offline.
// The service worker precaches every asset on first load; a reload with no network
// is then served from the precache.

test('reloads offline from the precache after one online load', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByTestId('tracer-value')).toHaveText('5/6');

  // clientsClaim: the first page becomes controlled once the worker activates,
  // which happens only after the precache is complete.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 });

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByTestId('tracer-value')).toHaveText('5/6');
    await expect(page).toHaveTitle('Numception Playtest');
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  } finally {
    await context.setOffline(false);
  }
});

test('links the flavour manifest under the base path', async ({ page, baseURL }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).not.toBeNull();
  const url = new URL(href ?? '', page.url());
  expect(url.href).toBe(new URL('manifest.webmanifest', baseURL).href);
  const manifest = (await (await page.request.get(url.href)).json()) as Record<string, unknown>;
  const basePath = new URL(baseURL ?? '').pathname;
  expect(manifest).toMatchObject({
    name: 'Numception Playtest',
    short_name: 'Numception Playtest',
    id: 'app.numception.playtest',
    display: 'standalone',
    scope: basePath,
    start_url: basePath,
  });
});

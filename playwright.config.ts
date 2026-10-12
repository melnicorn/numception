import { defineConfig, devices } from '@playwright/test';
import { basePath } from './apps/client/base-path.ts';

const port = 4173;
const baseURL = `http://localhost:${port}${basePath()}`;

// Renderer bake-off prototypes (tickets 8 and 9): each built and served on its own port.
const bakeoffPort = 4174;
const bakeoffURL = `http://localhost:${bakeoffPort}/`;
const bakeoffPixiPort = 4175;
const bakeoffPixiURL = `http://localhost:${bakeoffPixiPort}/`;

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  projects: [
    {
      name: 'webkit',
      testDir: 'apps/client/e2e',
      use: { ...devices['Desktop Safari'], baseURL },
    },
    {
      name: 'bakeoff-phaser',
      testDir: 'prototypes/renderer-bakeoff/phaser/e2e',
      // Small DPR-1 viewport: headless WebKit renders the three glow passes in
      // software, and at Desktop Safari's 1280x720 @2x it drops to ~15 fps, which
      // (with the spec's 100 ms delta clamp) stretches the 5 s loop past the test's
      // timing. Behaviour, not fps, is what this project checks.
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 480, height: 360 },
        deviceScaleFactor: 1,
        baseURL: bakeoffURL,
      },
    },
    {
      name: 'bakeoff-pixi',
      testDir: 'prototypes/renderer-bakeoff/pixi/e2e',
      // Same small DPR-1 viewport as bakeoff-phaser, for the same reason: software
      // WebKit and three glow passes, with behaviour (not fps) under test.
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 480, height: 360 },
        deviceScaleFactor: 1,
        baseURL: bakeoffPixiURL,
      },
    },
  ],
  webServer: [
    {
      // Serves the playtest build (apps/client/dist/playtest), as deployed to Pages.
      command: `FLAVOUR=playtest pnpm --filter @numception/client run preview --port ${port} --strictPort`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        `pnpm --filter @numception/bakeoff-phaser run build && ` +
        `pnpm --filter @numception/bakeoff-phaser run preview --port ${bakeoffPort} --strictPort`,
      url: bakeoffURL,
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        `pnpm --filter @numception/bakeoff-pixi run build && ` +
        `pnpm --filter @numception/bakeoff-pixi run preview --port ${bakeoffPixiPort} --strictPort`,
      url: bakeoffPixiURL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});

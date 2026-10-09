import { defineConfig, devices } from '@playwright/test';
import { basePath } from './apps/client/base-path.ts';

const port = 4173;
const baseURL = `http://localhost:${port}${basePath()}`;

export default defineConfig({
  testDir: 'apps/client/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL },
  projects: [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }],
  webServer: {
    command: `pnpm --filter @numception/client run preview --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});

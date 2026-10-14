import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/src/**/*.test.{ts,tsx}', 'packages/**/test/**/*.test.ts', 'apps/client/*.test.ts', 'tools/*.test.ts', 'tools/bench/*.test.ts', 'tools/nightly/*.test.ts'],
  },
});

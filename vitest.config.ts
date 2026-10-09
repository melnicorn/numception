import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/src/**/*.test.{ts,tsx}', 'apps/client/*.test.ts'],
  },
});

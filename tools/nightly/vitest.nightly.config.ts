import { defineConfig } from 'vitest/config';

// `pnpm nightly:check`: the FR-1 / AD-19 nightly uniqueness run, one n per job.
export default defineConfig({
  test: {
    include: ['tools/nightly/*.nightly-test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 3_600_000,
  },
});

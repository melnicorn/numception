import { defineConfig } from 'vitest/config';

// `pnpm bench:generator`: the AD-19 timing gate on one worker, no file parallelism,
// so other tests don't share the CPU while it measures.
export default defineConfig({
  test: {
    include: ['tools/bench/*.bench-test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 180_000,
  },
});

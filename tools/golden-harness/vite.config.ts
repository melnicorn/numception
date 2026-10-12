import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The WebKit golden-seed harness: a static page built from its own entry (not part
// of apps/client) that runs core's golden comparison in the browser. Served by the
// `golden-webkit` Playwright project; independent of BASE_PATH.
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  base: './',
  logLevel: 'warn',
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
});

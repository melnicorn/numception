import { defineConfig } from 'vite';

// Relative base so the build loads from the Capacitor shells' web root and from any
// static path. Phaser is one large module; raise the warning limit instead of splitting.
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});

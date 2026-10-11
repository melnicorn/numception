import { defineConfig } from 'vite';

// Relative base so the build loads from the Capacitor shells' web root and from any
// static path. Phaser is one large module; raise the warning limit instead of splitting.
export default defineConfig({
  base: './',
  // Glow tier for device measurement (ticket 3): full | lite | off. See src/glow-tier.ts.
  define: { __BAKEOFF_GLOW__: JSON.stringify(process.env.BAKEOFF_GLOW ?? 'full') },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});

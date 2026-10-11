import { defineConfig } from 'vite';

// Relative base so the build loads from the Capacitor shells' web root and from any
// static path. PixiJS loads its renderer and environment modules with dynamic
// imports, so the build has several chunks; only the WebGL path is fetched at runtime.
export default defineConfig({
  base: './',
  // Glow tier for device measurement (ticket 3): full | lite | off. See src/glow-tier.ts.
  define: { __BAKEOFF_GLOW__: JSON.stringify(process.env.BAKEOFF_GLOW ?? 'full') },
});

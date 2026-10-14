import preact from '@preact/preset-vite';
import { defineConfig, type Plugin, type PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { basePath } from './base-path.ts';
import { type Flavour, flavourOutDir, resolveFlavour } from './flavours.ts';

// FLAVOUR (dev | playtest | prod, default dev) picks the build (AD-18). An unknown
// value throws here, so `vite build` exits non-zero naming the valid flavours.
const flavour = resolveFlavour(process.env);
const base = basePath();

/** The neon game background; the manifest's theme and background colour. */
const BACKGROUND = '#05060a';

/** HTML-escapes a table value for an attribute or text node. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Writes the flavour's identity into the page, so storage and PWA work can namespace by it. */
function flavourIdentity(f: Flavour): Plugin {
  return {
    name: 'numception-flavour-identity',
    transformIndexHtml(html) {
      const title = `<title>${escapeHtml(f.appName)}</title>`;
      if (!/<title>[^<]*<\/title>/.test(html)) throw new Error('index.html has no <title> to replace');
      if (!/<html\b/.test(html)) throw new Error('index.html has no <html> element');
      return {
        html: html
          .replace(/<title>[^<]*<\/title>/, title)
          .replace(/<html\b/, `<html data-flavour="${escapeHtml(f.name)}"`),
        tags: [
          { tag: 'meta', attrs: { name: 'application-name', content: f.appName }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'numception-app-id', content: f.appId }, injectTo: 'head' },
        ],
      };
    },
  };
}

/**
 * Offline PWA for flavours with `pwa` (NFR-2): Workbox generateSW precaches every
 * emitted asset, so a reload with no network still runs. Workbox's runtime is
 * emitted next to sw.js, never fetched from a CDN (AD-18). Registration lives in
 * src/main.ts behind `__NUMCEPTION_PWA__`, so builds without it (dev) carry no
 * service-worker code at all.
 */
function offlinePwa(f: Flavour): PluginOption {
  return VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false,
    // The icon is already globbed below.
    includeManifestIcons: false,
    scope: base,
    manifest: {
      id: f.appId,
      name: f.appName,
      short_name: f.appName,
      start_url: base,
      scope: base,
      display: 'standalone',
      theme_color: BACKGROUND,
      background_color: BACKGROUND,
      lang: 'en',
      // Placeholder art (public/icon.svg); final icons come with the store work.
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    },
    workbox: {
      // Every emitted file (Workbox leaves out sw.js and its runtime): the precache
      // is the whole initial download, which tools/check-budget.mjs holds to NFR-1,
      // and tools/check-flavours.mjs checks nothing is missing from it. The plugin
      // adds manifest.webmanifest itself, so it isn't globbed (no duplicate entry).
      globPatterns: ['**/*'],
      globIgnores: ['**/node_modules/**/*', 'manifest.webmanifest'],
      // Workbox skips files over 2 MiB by default; allow up to the whole budget.
      maximumFileSizeToCacheInBytes: 5_000_000,
      navigateFallback: 'index.html',
      // autoUpdate without injected registration: take over on first load and
      // apply updates silently on the next load. No runtime caching, ever.
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
    },
  });
}

export default defineConfig({
  base,
  plugins: [preact(), flavourIdentity(flavour), ...(flavour.pwa ? [offlinePwa(flavour)] : [])],
  // Build-time constants (typed in src/flavour.ts). `__NUMCEPTION_DEV_PANEL__` is a
  // literal `false` in prod, so the guarded dev-panel import is dropped entirely.
  define: {
    __NUMCEPTION_FLAVOUR__: JSON.stringify(flavour.name),
    __NUMCEPTION_APP_ID__: JSON.stringify(flavour.appId),
    __NUMCEPTION_DEV_PANEL__: JSON.stringify(flavour.devPanel),
    __NUMCEPTION_PWA__: JSON.stringify(flavour.pwa),
  },
  build: {
    outDir: flavourOutDir(flavour),
    // The entry chunk carries PixiJS's WebGL renderer and browser environment
    // statically (so no lazy chunk delays the first puzzle frame): ~525 kB raw,
    // ~155 kB gzipped. NFR-1's real limit is tools/check-budget.mjs.
    chunkSizeWarningLimit: 600,
  },
});

import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vite';
import { basePath } from './base-path.ts';
import { type Flavour, flavourOutDir, resolveFlavour } from './flavours.ts';

// FLAVOUR (dev | playtest | prod, default dev) picks the build (AD-18). An unknown
// value throws here, so `vite build` exits non-zero naming the valid flavours.
const flavour = resolveFlavour(process.env);

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

export default defineConfig({
  base: basePath(),
  plugins: [preact(), flavourIdentity(flavour)],
  // Build-time constants (typed in src/flavour.ts). `__NUMCEPTION_DEV_PANEL__` is a
  // literal `false` in prod, so the guarded dev-panel import is dropped entirely.
  define: {
    __NUMCEPTION_FLAVOUR__: JSON.stringify(flavour.name),
    __NUMCEPTION_DEV_PANEL__: JSON.stringify(flavour.devPanel),
  },
  build: {
    outDir: flavourOutDir(flavour),
  },
});

// Composition root: wires packages together; never imports Preact directly (AD-1).
import { mountTracer } from '@numception/ui';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root element');
}
mountTracer(root);

// Dev panel: dev and playtest only. The constant is a literal `false` in prod, so
// the bundler drops this branch and emits no dev-panel chunk (AD-18). The tuning
// JSON is imported here too, so prod never bundles it, and passed in explicitly (AD-7).
if (__NUMCEPTION_DEV_PANEL__) {
  const host = document.createElement('div');
  document.body.append(host);
  void Promise.all([import('@numception/ui/dev-panel'), import('../../../content/tuning/1.json')]).then(
    ([{ mountDevPanel }, tuning]) => mountDevPanel(host, tuning.default),
  );
}

// Offline PWA (NFR-2): playtest and prod only. The constant is a literal `false` in
// dev, so dev builds carry no service-worker code. Browsers without service workers
// skip it, and so do the Capacitor shells: iOS serves from a custom scheme, and
// Android's https://localhost WebView would otherwise register one, so native
// platforms are skipped explicitly and keep loading the bundled files as before.
if (__NUMCEPTION_PWA__ && 'serviceWorker' in navigator && !isNativeShell()) {
  const base = import.meta.env.BASE_URL;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch((error: unknown) => {
      // Offline play is lost, the game is not: never break the page over it.
      console.warn('Service worker registration failed', error);
    });
  });
}

/** True inside a Capacitor native shell (its bridge defines `window.Capacitor` before scripts run). */
function isNativeShell(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() === true;
}

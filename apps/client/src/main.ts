// Composition root: wires packages together; never imports Preact directly (AD-1).
import { createGame, parseTuning } from '@numception/app';
import { createRenderer } from '@numception/render';
import { webEntropy } from './web-entropy';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root element');
}

// The active tuning is bundled (offline works) and passed in explicitly (AD-7).
const ACTIVE_TUNING_VERSION = '1';
const bundledTuning = import.meta.glob<unknown>('../../../content/tuning/1.json', { eager: true, import: 'default' });
const activeTuningJson = Object.values(bundledTuning)[0];
const tuning = parseTuning(activeTuningJson);

if (!tuning.ok) {
  // Playtest and dev only in practice: a shipped tuning is validated in CI. Plain text, never a crash loop.
  root.textContent = `Numception could not start: ${tuning.error.message}`;
} else {
  const now = () => Date.now();
  const game = createGame({ tuning: tuning.value, entropy: webEntropy(now), now });
  // One call stack per tap: render -> app -> core -> app -> render (AD-2).
  const renderer = createRenderer({ onTap: (ref) => game.dispatch({ type: 'TapCell', ...ref }) });
  game.subscribe((view) => renderer.render(view));
  game.dispatch({ type: 'StartSession' });
  renderer.render(game.getView());
  // Test hook: dev and playtest only (the constant is a literal `false` in prod, AD-18).
  if (__NUMCEPTION_DEV_PANEL__) {
    void import('./test-hook').then(({ installTestHook }) => installTestHook(game, renderer));
  }
  void renderer.mount(root).catch((error: unknown) => {
    console.warn('Renderer failed to start', error);
    root.textContent = `Numception could not start: ${error instanceof Error ? error.message : String(error)}`;
  });
}

// Dev panel: dev and playtest only. The constant is a literal `false` in prod, so
// the bundler drops this branch and emits no dev-panel chunk (AD-18). Every bundled
// tuning file (content/tuning/<tuningVersion>.json; shipped.json is the shipped-hash
// list, not a tuning) is globbed lazily here too, and the map, keyed by tuning
// version, is passed in explicitly (AD-7).
if (__NUMCEPTION_DEV_PANEL__) {
  const host = document.createElement('div');
  document.body.append(host);
  // The active tuning is already bundled above, so it is reused rather than globbed
  // lazily again (a module both static and dynamic would gain nothing from the split).
  const tuningFiles: Record<string, () => Promise<unknown>> = {
    ...import.meta.glob<unknown>(
      ['../../../content/tuning/*.json', '!../../../content/tuning/shipped.json', '!../../../content/tuning/1.json'],
      { import: 'default' },
    ),
    [`${ACTIVE_TUNING_VERSION}.json`]: () => Promise.resolve(activeTuningJson),
  };
  // A tuning that fails to load is left out (and logged); the panel still mounts
  // with the rest. A failed panel chunk is logged too, never left unhandled.
  const loadTunings = Promise.allSettled(
    Object.entries(tuningFiles).map(async ([path, load]) => [path.replace(/^.*\/|\.json$/g, ''), await load()] as const),
  ).then((results) =>
    results.flatMap((r) => {
      if (r.status === 'fulfilled') return [r.value];
      console.warn('Dev panel: a tuning file failed to load', r.reason);
      return [];
    }),
  );
  void Promise.all([import('@numception/ui/dev-panel'), loadTunings])
    .then(([{ mountDevPanel }, entries]) => mountDevPanel(host, Object.fromEntries(entries)))
    .catch((error: unknown) => {
      console.warn('Dev panel failed to load', error);
      host.textContent = `Dev panel failed to load: ${error instanceof Error ? error.message : String(error)}`;
    });
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

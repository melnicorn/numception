// Composition root: wires packages together; never imports Preact directly (AD-1).
import {
  createGame,
  createSaveWriter,
  createScheduler,
  loadSave,
  parseTuning,
  saveAfterBatches,
  tapCommand,
  type TuningConfig,
} from '@numception/app';
import { webLifecycle, webStorage } from '@numception/platform-web';
import { createRenderer } from '@numception/render';
import { mountGuideLine } from '@numception/ui';
import { webEntropy } from './web-entropy';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root element');
}

/** How long boot waits for the save before playing in memory (no writes) instead. */
const LOAD_TIMEOUT_MS = 2500;

// The active tuning is bundled (offline works) and passed in explicitly (AD-7).
const ACTIVE_TUNING_VERSION = '1';
const bundledTuning = import.meta.glob<unknown>('../../../content/tuning/1.json', { eager: true, import: 'default' });
const activeTuningJson = Object.values(bundledTuning)[0];
const tuning = parseTuning(activeTuningJson);

if (!tuning.ok) {
  // Playtest and dev only in practice: a shipped tuning is validated in CI. Plain text, never a crash loop.
  root.textContent = `Numception could not start: ${tuning.error.message}`;
} else {
  void boot(root, tuning.value);
}

/**
 * Loads the save (one IndexedDB read, AD-10) before anything is painted, so the
 * first frame is the restored puzzle, or a new one when nothing is saved (FR-10).
 */
async function boot(el: HTMLElement, activeTuning: TuningConfig): Promise<void> {
  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  // One database per flavour (AD-18); IndexedDB in the Capacitor shell too for the POC.
  const storage = webStorage(__NUMCEPTION_APP_ID__);
  const session = await loadSave(storage, wait, LOAD_TIMEOUT_MS);

  const now = () => Date.now();
  const game = createGame({ tuning: activeTuning, entropy: webEntropy(now), now });
  // The play clock (AD-17): Ticks from the frame loop while a beat runs, on the
  // monotonic clock; idle time is flushed before each command (see createScheduler).
  // Its pause set is core's (`Pause` / `Resume`).
  const scheduler = createScheduler({
    game,
    now: () => performance.now(),
    frames: { request: (callback) => requestAnimationFrame(() => callback()), cancel: (handle) => cancelAnimationFrame(handle) },
  });
  // Saves after every batch with a non-Tick command and on Pause (AD-10); never
  // when the save came from a newer build or could not be read.
  const writer = session.writable
    ? createSaveWriter({
        storage,
        generation: session.generation,
        wait,
        onError: __NUMCEPTION_FLAVOUR__ === 'dev' ? (error) => console.warn('Save failed; retrying', error) : undefined,
      })
    : null;
  if (writer !== null) saveAfterBatches(game, writer, (fn) => setTimeout(fn, 0));
  // One call stack per tap: render -> app -> core -> app -> render (AD-2). A tap on
  // a puzzle answers it; on an overview it enters the cell's puzzle (FR-9).
  const renderer = createRenderer({
    onTap: (ref) => {
      const view = game.getView();
      const command = view === null ? null : tapCommand(view, ref);
      if (command !== null) scheduler.dispatch(command);
    },
  });
  game.subscribe((view) => renderer.render(view));
  // The guide-line slot, a band above the board (DOM, AD-13; index.html): core decides the line; ui shows it.
  const guideSlot = document.getElementById('guide');
  if (guideSlot !== null) mountGuideLine(guideSlot, game);
  scheduler.dispatch(session.restore === null ? { type: 'StartSession' } : { type: 'StartSession', restore: session.restore });
  // A restore core refused (it never should: it parsed) falls back to a new session.
  if (game.getView() === null) scheduler.dispatch({ type: 'StartSession' });
  renderer.render(game.getView());
  // Backgrounding pauses play, completes any beat, saves, and veils the board until the next tap (AD-17).
  webLifecycle().start((command) => (command.type === 'Pause' ? scheduler.pause(command.reason) : scheduler.resume(command.reason)));
  const mountedView = game.getView();
  // Test hook: dev and playtest only (the constant is a literal `false` in prod, AD-18).
  if (__NUMCEPTION_DEV_PANEL__) {
    void import('./test-hook').then(({ installTestHook }) =>
      installTestHook(game, renderer, { mountedView, saves: () => writer?.stats() ?? null }),
    );
  }
  try {
    await renderer.mount(el);
  } catch (error: unknown) {
    console.warn('Renderer failed to start', error);
    el.textContent = `Numception could not start: ${error instanceof Error ? error.message : String(error)}`;
  }
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

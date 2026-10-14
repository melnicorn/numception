// Composition root: wires packages together; never imports Preact directly (AD-1).
import {
  createFeedbackDirector,
  createGame,
  type FeedbackControls,
  createSaveWriter,
  createScheduler,
  loadSave,
  loadThemeCatalog,
  noHaptics,
  parseTuning,
  type ThemeCatalog,
  saveAfterBatches,
  tapCommand,
  type TuningConfig,
  type TuningsByVersion,
} from '@numception/app';
import { webAudio, webFeedbackFlags, webLifecycle, webStorage } from '@numception/platform-web';
import { createRenderer } from '@numception/render';
import { mountGuideLine } from '@numception/ui';
import { type CueCall, recordingAudio } from './recording-audio';
import { webEntropy } from './web-entropy';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root element');
}

// Sound (FR-41, AD-16): procedural Web Audio behind the AudioPort, haptics a no-op
// until entry 3, and the one FeedbackDirector mapping events to them, gated by the
// effects and music flags (dev flags in localStorage for now; entry 4 moves them
// into profile settings). Dev and playtest record every cue the director plays, for
// the e2e specs (the test hook's `cues`).
const cueLog: CueCall[] = [];
const feedbackFlags = webFeedbackFlags(__NUMCEPTION_APP_ID__);
const director = createFeedbackDirector({
  audio: __NUMCEPTION_DEV_PANEL__ ? recordingAudio(webAudio(), cueLog) : webAudio(),
  haptics: noHaptics,
  flags: feedbackFlags.read(),
});
const feedbackControls: FeedbackControls = {
  get: () => director.flags(),
  set: (flags) => {
    feedbackFlags.write(flags);
    director.setFlags(flags);
  },
};
// The audio output unlocks inside a user gesture: the first press anywhere (captured
// before the canvas handles it, so a first-tap solve can sound). iOS counts the
// release (touchend / pointerup) as the activating gesture for touch, so those
// unlock too; once running, each call is a no-op.
for (const type of ['pointerdown', 'pointerup', 'touchend'] as const) {
  window.addEventListener(type, () => director.unlock(), { capture: true, passive: true });
}

/** How long boot waits for the save before playing in memory (no writes) instead. */
const LOAD_TIMEOUT_MS = 2500;

// Every tuning version is bundled (offline works; a few KB each) and the latest is
// the active one, passed in explicitly (AD-7). shipped.json is the shipped-hash
// list, not a tuning.
const bundledTunings = import.meta.glob<unknown>(['../../../content/tuning/*.json', '!../../../content/tuning/shipped.json'], {
  eager: true,
  import: 'default',
});
/** Bundled tuning JSON by tuningVersion (its file name). */
const tuningByVersion = new Map(
  Object.entries(bundledTunings).flatMap(([path, json]) => {
    const version = Number(path.replace(/^.*\/|\.json$/g, ''));
    return Number.isSafeInteger(version) && version > 0 ? [[version, json] as const] : [];
  }),
);
const activeTuningVersion = Math.max(0, ...tuningByVersion.keys());
const tuning = parseTuning(tuningByVersion.get(activeTuningVersion));
// Every bundled version, validated, so a saved round pinned to an older tuning still
// realises its leaves under it (AD-7); a version that fails validation is left out.
const tunings: TuningsByVersion = Object.fromEntries(
  [...tuningByVersion].flatMap(([version, json]) => {
    const parsed = parseTuning(json);
    if (!parsed.ok && __NUMCEPTION_FLAVOUR__ === 'dev') console.warn(`Tuning ${version} left out: ${parsed.error.message}`);
    return parsed.ok && parsed.value.tuningVersion === version ? [[version, parsed.value] as const] : [];
  }),
);

// The theme catalogue (AD-15): every bundled content/themes/*.json, validated; a
// theme that fails is left out (logged in dev), and with none the built-in Kiln.
const themeCatalog = loadThemeCatalog(import.meta.glob<unknown>('../../../content/themes/*.json', { eager: true, import: 'default' }));
if (__NUMCEPTION_FLAVOUR__ === 'dev') {
  for (const rejected of themeCatalog.rejected) console.warn(`Theme ${rejected.source} left out: ${rejected.message}`);
}

if (!tuning.ok) {
  // Playtest and dev only in practice: a shipped tuning is validated in CI. Plain text, never a crash loop.
  root.textContent = `Numception could not start: ${tuning.error.message}`;
} else {
  void boot(root, tuning.value, tunings, themeCatalog.themes);
}

/** How long boot waits for the themes' faces before drawing anyway (system fonts resolve at once). */
const FONT_TIMEOUT_MS = 800;

/**
 * Waits until every theme's face is loaded at its numeral weights (Pixi measures
 * text when it rasterises, so a face that arrives late would leave numerals sized
 * for the fallback). POC faces are system font stacks; never blocks past
 * `FONT_TIMEOUT_MS` or fails boot.
 */
async function loadFaces(themes: ThemeCatalog, wait: (ms: number) => Promise<void>): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts === undefined) return;
  const faces = new Set(themes.flatMap((t) => [t.fontWeight, t.fontWeightSolved, '400'].map((w) => `${w} ${t.numberSizePx}px ${t.fontFamily}`)));
  await Promise.race([Promise.allSettled([...faces].map((face) => fonts.load(face))), wait(FONT_TIMEOUT_MS)]);
}

/**
 * Loads the save (one IndexedDB read, AD-10) before anything is painted, so the
 * first frame is the restored puzzle, or a new one when nothing is saved (FR-10).
 */
async function boot(el: HTMLElement, activeTuning: TuningConfig, tunings: TuningsByVersion, themes: ThemeCatalog): Promise<void> {
  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  // One database per flavour (AD-18); IndexedDB in the Capacitor shell too for the POC.
  const storage = webStorage(__NUMCEPTION_APP_ID__);
  const [session] = await Promise.all([loadSave(storage, wait, LOAD_TIMEOUT_MS), loadFaces(themes, wait)]);

  const now = () => Date.now();
  const game = createGame({ tuning: activeTuning, tunings, themes, entropy: webEntropy(now), now });
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
    // The page around the canvas (the guide-line band, the safe areas) follows the
    // surface the frame is drawn on, through the round change too: the whole screen
    // changes theme, not only the canvas.
    onSurface: (color) => {
      document.body.style.backgroundColor = color;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    },
  });
  game.subscribe((view) => renderer.render(view));
  // The director hears each dispatch's events, the same synchronous batch the renderer sees (AD-2, AD-16).
  game.subscribe((_view, events) => director.handle(events));
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
      installTestHook(game, renderer, { mountedView, saves: () => writer?.stats() ?? null, cues: () => cueLog }),
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
// tuning file (already bundled above) is passed in as a map keyed by tuning
// version, explicitly (AD-7).
if (__NUMCEPTION_DEV_PANEL__) {
  const host = document.createElement('div');
  document.body.append(host);
  const tuningFiles: Record<string, () => Promise<unknown>> = Object.fromEntries(
    [...tuningByVersion].map(([version, json]) => [`${version}.json`, () => Promise.resolve(json)]),
  );
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
    .then(([{ mountDevPanel }, entries]) => mountDevPanel(host, Object.fromEntries(entries), feedbackControls))
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

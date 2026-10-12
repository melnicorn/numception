// Build flavours (AD-18): the single source for every per-flavour value. Read by
// vite.config.ts, capacitor.config.ts, scripts/write-ios-flavour.mjs and
// tools/check-flavours.mjs. `FLAVOUR` is read in apps/client only.
//
// Plain erasable TypeScript only: Node loads this file directly (type stripping)
// from the .mjs scripts and from Capacitor's config loader.

export const FLAVOUR_NAMES = ['dev', 'playtest', 'prod'] as const;

export type FlavourName = (typeof FLAVOUR_NAMES)[number];

export interface Flavour {
  readonly name: FlavourName;
  /** Bundle id / applicationId; also written into the web page so storage can namespace by it. */
  readonly appId: string;
  /** Display name on the device and the page title. */
  readonly appName: string;
  /** Whether the dev panel ships in this build. Prod never ships it. */
  readonly devPanel: boolean;
  /**
   * Whether the web build is an offline PWA (service worker precaching every asset,
   * plus a web app manifest; NFR-2). Dev never registers a service worker.
   */
  readonly pwa: boolean;
}

export const FLAVOURS: Readonly<Record<FlavourName, Flavour>> = {
  dev: { name: 'dev', appId: 'app.numception.dev', appName: 'Numception Dev', devPanel: true, pwa: false },
  playtest: { name: 'playtest', appId: 'app.numception.playtest', appName: 'Numception Playtest', devPanel: true, pwa: true },
  // `app.numception` is a placeholder store id until registration (epic-native-apps).
  prod: { name: 'prod', appId: 'app.numception', appName: 'Numception', devPanel: false, pwa: true },
};

export const DEFAULT_FLAVOUR: FlavourName = 'dev';

/** Resolves `FLAVOUR` (unset or empty means dev); throws on an unknown value, naming the valid ones. */
export function resolveFlavour(env: Readonly<Record<string, string | undefined>> = process.env): Flavour {
  const raw = (env.FLAVOUR ?? '').trim();
  if (raw === '') return FLAVOURS[DEFAULT_FLAVOUR];
  if (!Object.hasOwn(FLAVOURS, raw)) {
    throw new Error(`Unknown FLAVOUR="${raw}". Expected one of: ${FLAVOUR_NAMES.join(', ')} (or unset for dev).`);
  }
  return FLAVOURS[raw as FlavourName];
}

/** Build output directory for a flavour, relative to apps/client. */
export function flavourOutDir(flavour: Flavour): string {
  return `dist/${flavour.name}`;
}

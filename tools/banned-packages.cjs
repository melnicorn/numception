// @ts-check
'use strict';

/**
 * The banned-dependency list (AD-1, AD-12, AD-18; PRD §9.1). One source of truth:
 * `.dependency-cruiser.cjs` forbids importing any of these, and
 * `tools/check-supply.mjs` fails if any of them appears anywhere in `pnpm-lock.yaml`
 * (direct or transitive, imported or not).
 *
 * Each entry is an npm package name. `*` matches any run of characters within one
 * name segment (it never crosses the `/` after a scope), so `@sentry/*` bans the
 * whole scope. An entry without a scope also matches that name under any scope, so
 * `*appsflyer*` bans `appsflyer-capacitor-plugin` and `@acme/appsflyer` alike.
 * Contains-globs are used only for distinctive vendor names; generic words
 * (e.g. "adjust", "branch", "segment") are listed as exact names instead.
 */

/** @typedef {{ group: string, comment: string, packages: readonly string[] }} BannedGroup */

/** @type {readonly BannedGroup[]} */
const bannedGroups = [
  {
    group: 'advertising',
    // No ads in the POC; v1 monetization is a parent-gated purchase, never ads (AD-11, PRD §9.1).
    comment: 'Ad SDKs: AdMob / Google Mobile Ads, AppLovin, ironSource, Unity Ads.',
    packages: [
      '*admob*',
      '@capacitor-community/admob',
      '@admob-plus/*',
      'react-native-google-mobile-ads',
      '@google-ads/*',
      '*applovin*',
      '*ironsource*',
      '*unity-ads*',
      '@unity-ads/*',
    ],
  },
  {
    group: 'attribution',
    // Install attribution and deep-link tracking vendors (AD-1).
    comment: 'Attribution SDKs: AppsFlyer, Adjust, Branch, Kochava, Singular.',
    packages: [
      '*appsflyer*',
      '@adjustcom/*',
      'react-native-adjust',
      'cordova-plugin-adjust',
      'branch-sdk',
      'capacitor-branch-deep-links',
      'react-native-branch',
      'cordova-plugin-branch',
      '*kochava*',
      'singular-sdk',
      '@singular/*',
      'singular-react-native',
    ],
  },
  {
    group: 'third-party-analytics',
    // Telemetry is first-party only: one schema, exported via the dev panel in the POC (AD-12).
    comment: 'Third-party analytics: Firebase / Google Analytics, Mixpanel, Amplitude, Segment, PostHog.',
    packages: [
      '@firebase/analytics*',
      '@capacitor-firebase/analytics',
      '@capacitor-community/firebase-analytics',
      '@react-native-firebase/analytics',
      'react-ga',
      'react-ga4',
      'ga-4-react',
      'vue-gtag',
      'universal-analytics',
      '@analytics/google-analytics',
      '*mixpanel*',
      '@mixpanel/*',
      '@amplitude/*',
      'amplitude-js',
      '@segment/*',
      'analytics-node',
      'posthog-*',
      '@posthog/*',
      '@vercel/analytics',
    ],
  },
  {
    group: 'crash-reporting',
    // The crash signal is AppError events plus store vitals; no third-party crash SDK in the POC (AD-12).
    comment: 'Crash SDKs: Sentry, Bugsnag, Crashlytics.',
    packages: [
      '@sentry/*',
      '@sentry-internal/*',
      '*sentry*',
      'raven-js',
      '@bugsnag/*',
      'bugsnag*',
      '*crashlytics*',
      '@capacitor-firebase/crashlytics',
      '@capacitor-community/firebase-crashlytics',
      '@react-native-firebase/crashlytics',
    ],
  },
  {
    group: 'live-update',
    // Code reaches native players only through store builds, never over the air (AD-18).
    comment: 'Live-update and OTA plugins: Capgo updater, Ionic Appflow live updates, Capawesome live-update, CodePush.',
    packages: [
      '@capgo/capacitor-updater',
      '@capgo/cli',
      '@capacitor/live-updates',
      '@ionic/live-updates',
      'cordova-plugin-ionic',
      '@capawesome/capacitor-live-update',
      '*code-push*',
      '*codepush*',
      '@code-push-next/*',
    ],
  },
];

/** Every banned package pattern, flattened. */
const bannedPackages = bannedGroups.flatMap((g) => g.packages);

/** @param {string} s */
function escapeRegExp(s) {
  return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Regex source for one package glob: `*` becomes "any characters except `/`", and an
 * unscoped glob may be preceded by any scope.
 * @param {string} glob
 */
function globToRegExpSource(glob) {
  const body = glob.split('*').map(escapeRegExp).join('[^/]*');
  // Two alternatives rather than an optional `(@scope/)?` group: dependency-cruiser
  // rejects nested quantifiers as unsafe regular expressions.
  return glob.includes('/') ? body : `${body}|@[^/]+/${body}`;
}

/** Regex source matching a whole package name against any banned glob. */
const bannedNameSource = `(?:${bannedPackages.map(globToRegExpSource).join('|')})`;

/**
 * Returns the banned glob a package name matches, or undefined.
 * @param {string} name
 * @returns {{ pattern: string, group: string } | undefined}
 */
function matchBanned(name) {
  for (const g of bannedGroups) {
    for (const pattern of g.packages) {
      if (new RegExp(`^(?:${globToRegExpSource(pattern)})$`).test(name)) {
        return { pattern, group: g.group };
      }
    }
  }
  return undefined;
}

module.exports = { bannedGroups, bannedPackages, bannedNameSource, globToRegExpSource, matchBanned };

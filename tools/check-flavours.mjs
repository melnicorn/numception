// @ts-check
// Flavour check for AD-18, run after `pnpm build` (all three flavours):
//
//  1. The flavour table has distinct appIds and names.
//  2. Each apps/client/dist/<flavour>/index.html carries the flavour's identity
//     (meta numception-app-id, meta application-name, <title>, data-flavour).
//  3. The iOS xcconfig generator emits each flavour's id and name, and the
//     checked-in fallback (ios/flavour-base.xcconfig) matches dev.
//  4. android/app/build.gradle follows the last sync, like iOS: applicationId and
//     app_name come from the synced capacitor.config.json (dev fallback), and there
//     are no hard-coded productFlavors that could pair a prod id with a dev bundle.
//  5. Dev-panel builds contain the dev-panel marker and its chunk; builds without
//     the panel (prod) contain neither the marker, nor "dev-panel" anywhere, nor a
//     dev-panel chunk.
//
// Usage: node tools/check-flavours.mjs [--root <dir>]
// Exits 1 and prints every finding.

import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLAVOURS } from '../apps/client/flavours.ts';
import { xcconfigFor } from '../apps/client/scripts/write-ios-flavour.mjs';

/** @typedef {import('../apps/client/flavours.ts').Flavour} Flavour */

/**
 * The dev-panel marker: the panel region's id (DEV_PANEL_ID in
 * packages/ui/src/dev-panel/dev-panel.tsx). The check also confirms that source
 * still contains it, so a rename can't make the prod scan pass vacuously.
 */
export const DEV_PANEL_MARKER = 'numception-dev-panel';
/** Prod must not mention the dev panel at all: no testid, chunk name or import path. */
const PROD_FORBIDDEN = 'dev-panel';
const DEV_PANEL_SOURCE = 'packages/ui/src/dev-panel/dev-panel.tsx';
const BUILD_GRADLE = 'apps/client/android/app/build.gradle';
const IOS_BASE_XCCONFIG = 'apps/client/ios/flavour-base.xcconfig';

/**
 * Reads `KEY = value` lines from xcconfig text (comments and includes skipped).
 * @param {string} text
 * @returns {Map<string, string>}
 */
export function parseXcconfig(text) {
  const out = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\/\/.*$/, '').trim();
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && m[1]) out.set(m[1], (m[2] ?? '').trim());
  }
  return out;
}

/**
 * How build.gradle sources the Android app id and name. The expected wiring reads
 * them from the synced `src/main/assets/capacitor.config.json` into variables with
 * a literal fallback: `def v = cap.appId ?: 'app.numception.dev'`.
 * @param {string} text
 */
export function parseGradleWiring(text) {
  // Drop line comments (`//` at line start or after whitespace) so prose can't match.
  const code = text.replace(/(^|\s)\/\/.*$/gm, '$1');
  /** The literal fallback of `def <name> = <x>.<field> ?: '<literal>'`, if wired that way. */
  const fallback = (/** @type {string | undefined} */ name, /** @type {string} */ field) =>
    name === undefined
      ? undefined
      : code.match(new RegExp(`\\bdef\\s+${name}\\s*=\\s*\\w+\\.${field}\\s*\\?:\\s*["']([^"']+)["']`))?.[1];
  const appIdExpr = code.match(/\bapplicationId\s*=?\s*([^\s]+)/)?.[1];
  const appNameExpr = code.match(
    /\bresValue\s*\(?\s*["']string["']\s*,\s*["']app_name["']\s*,\s*([^\s)]+)/,
  )?.[1];
  const isVar = (/** @type {string | undefined} */ e) => (e !== undefined && /^\w+$/.test(e) ? e : undefined);
  return {
    readsSyncedConfig: /src\/main\/assets\/capacitor\.config\.json/.test(code) && /\bJsonSlurper\b/.test(code),
    hasProductFlavors: /\b(?:productFlavors|flavorDimensions)\b/.test(code),
    appIdExpr,
    appNameExpr,
    appIdFallback: fallback(isVar(appIdExpr), 'appId'),
    appNameFallback: fallback(isVar(appNameExpr), 'appName'),
  };
}

/**
 * Reads an attribute from the first tag matching `tagPattern` (attributes in any order).
 * @param {string} html
 * @param {RegExp} tagPattern
 * @param {string} attr
 */
function attrOf(html, tagPattern, attr) {
  const tag = html.match(tagPattern)?.[0];
  return tag?.match(new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`))?.[1];
}

/**
 * Identity written into a built index.html.
 * @param {string} html
 */
export function pageIdentity(html) {
  return {
    appId: attrOf(html, /<meta\b[^>]*\bname\s*=\s*"numception-app-id"[^>]*>/, 'content'),
    applicationName: attrOf(html, /<meta\b[^>]*\bname\s*=\s*"application-name"[^>]*>/, 'content'),
    title: html.match(/<title>([^<]*)<\/title>/)?.[1],
    flavour: attrOf(html, /<html\b[^>]*>/, 'data-flavour'),
  };
}

/**
 * @param {string} dir
 * @returns {Generator<string>}
 */
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

/**
 * Runs every check against a repo root. Returns the findings (empty means pass).
 * @param {string} root
 * @returns {string[]}
 */
export function checkFlavours(root) {
  /** @type {string[]} */
  const errors = [];
  const flavours = Object.values(FLAVOURS);

  // 1. Table.
  for (const key of /** @type {const} */ (['appId', 'appName'])) {
    const values = flavours.map((f) => f[key]);
    if (new Set(values).size !== values.length) errors.push(`flavour table: duplicate ${key} in ${values.join(', ')}`);
  }

  // 3. iOS.
  const xcIds = flavours.map((f) => {
    const xc = parseXcconfig(xcconfigFor(f));
    if (xc.get('NUMCEPTION_APP_ID') !== f.appId) {
      errors.push(`ios: generated xcconfig for ${f.name} has NUMCEPTION_APP_ID=${xc.get('NUMCEPTION_APP_ID')}, expected ${f.appId}`);
    }
    if (xc.get('NUMCEPTION_APP_NAME') !== f.appName) {
      errors.push(`ios: generated xcconfig for ${f.name} has NUMCEPTION_APP_NAME=${xc.get('NUMCEPTION_APP_NAME')}, expected ${f.appName}`);
    }
    return xc.get('NUMCEPTION_APP_ID');
  });
  if (new Set(xcIds).size !== xcIds.length) errors.push(`ios: generated xcconfig ids are not distinct: ${xcIds.join(', ')}`);
  const basePath = join(root, IOS_BASE_XCCONFIG);
  if (!existsSync(basePath)) {
    errors.push(`ios: ${IOS_BASE_XCCONFIG} is missing`);
  } else {
    const base = parseXcconfig(readFileSync(basePath, 'utf8'));
    if (base.get('NUMCEPTION_APP_ID') !== FLAVOURS.dev.appId || base.get('NUMCEPTION_APP_NAME') !== FLAVOURS.dev.appName) {
      errors.push(`ios: ${IOS_BASE_XCCONFIG} fallback must be the dev id and name (${FLAVOURS.dev.appId}, ${FLAVOURS.dev.appName})`);
    }
  }

  // 4. Android.
  const gradlePath = join(root, BUILD_GRADLE);
  if (!existsSync(gradlePath)) {
    errors.push(`android: ${BUILD_GRADLE} is missing`);
  } else {
    const g = parseGradleWiring(readFileSync(gradlePath, 'utf8'));
    if (g.hasProductFlavors) {
      errors.push(`android: ${BUILD_GRADLE} must not declare productFlavors/flavorDimensions (it follows the last cap:sync)`);
    }
    if (!g.readsSyncedConfig) {
      errors.push(`android: ${BUILD_GRADLE} must read src/main/assets/capacitor.config.json with JsonSlurper`);
    }
    if (g.appIdFallback === undefined) {
      errors.push(`android: applicationId (${g.appIdExpr}) must come from the synced config's appId with a dev fallback`);
    } else if (g.appIdFallback !== FLAVOURS.dev.appId) {
      errors.push(`android: applicationId fallback is ${g.appIdFallback}, expected ${FLAVOURS.dev.appId}`);
    }
    if (g.appNameFallback === undefined) {
      errors.push(`android: app_name resValue (${g.appNameExpr}) must come from the synced config's appName with a dev fallback`);
    } else if (g.appNameFallback !== FLAVOURS.dev.appName) {
      errors.push(`android: app_name fallback is ${g.appNameFallback}, expected ${FLAVOURS.dev.appName}`);
    }
  }

  // The marker must exist in the panel source, or the prod scan proves nothing.
  const panelSource = join(root, DEV_PANEL_SOURCE);
  if (!existsSync(panelSource) || !readFileSync(panelSource, 'utf8').includes(DEV_PANEL_MARKER)) {
    errors.push(`dev panel: marker "${DEV_PANEL_MARKER}" not found in ${DEV_PANEL_SOURCE}`);
  }

  // 2 and 5. Web builds.
  const pageIds = [];
  for (const f of flavours) {
    const distRel = `apps/client/dist/${f.name}`;
    const dist = join(root, distRel);
    const indexPath = join(dist, 'index.html');
    if (!existsSync(indexPath)) {
      errors.push(`web ${f.name}: ${distRel}/index.html is missing (run pnpm build first)`);
      continue;
    }
    const id = pageIdentity(readFileSync(indexPath, 'utf8'));
    pageIds.push(id.appId);
    if (id.appId !== f.appId) errors.push(`web ${f.name}: meta numception-app-id is ${id.appId}, expected ${f.appId}`);
    if (id.applicationName !== f.appName) {
      errors.push(`web ${f.name}: meta application-name is ${id.applicationName}, expected ${f.appName}`);
    }
    if (id.title !== f.appName) errors.push(`web ${f.name}: <title> is ${id.title}, expected ${f.appName}`);
    if (id.flavour !== f.name) errors.push(`web ${f.name}: <html data-flavour> is ${id.flavour}, expected ${f.name}`);

    const files = [...walk(dist)].map((p) => relative(dist, p).split(sep).join('/'));
    const chunks = files.filter((p) => /dev-panel/i.test(p));
    const withMarker = files.filter((p) => readFileSync(join(dist, p), 'utf8').includes(DEV_PANEL_MARKER));
    if (f.devPanel) {
      if (withMarker.length === 0) errors.push(`web ${f.name}: dev-panel marker "${DEV_PANEL_MARKER}" not found in ${distRel}`);
      if (!chunks.some((p) => p.endsWith('.js'))) errors.push(`web ${f.name}: no dev-panel chunk in ${distRel}`);
    } else {
      for (const p of chunks) errors.push(`web ${f.name}: dev-panel file ${distRel}/${p} must not ship`);
      for (const p of files) {
        if (readFileSync(join(dist, p), 'utf8').includes(PROD_FORBIDDEN)) {
          errors.push(`web ${f.name}: ${distRel}/${p} mentions "${PROD_FORBIDDEN}"`);
        }
      }
    }
  }
  if (new Set(pageIds).size !== pageIds.length) errors.push(`web: page app ids are not distinct: ${pageIds.join(', ')}`);

  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const rootFlag = args.indexOf('--root');
  const root = rootFlag >= 0 && args[rootFlag + 1] ? args[rootFlag + 1] : process.cwd();
  const errors = checkFlavours(root);
  for (const e of errors) console.error(`  error ${e}`);
  if (errors.length > 0) {
    console.error(`\nx check-flavours: ${errors.length} finding(s). See AD-18 and apps/client/flavours.ts.`);
    process.exit(1);
  }
  console.log(
    `✔ check-flavours: ${Object.keys(FLAVOURS).join(', ')} have distinct ids across table, web and iOS; Android follows the synced config; ` +
      'dev panel only where enabled',
  );
}

/** True when this file is the entry point, even if invoked through a symlink. */
function isEntryPoint() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entry);
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  main();
}

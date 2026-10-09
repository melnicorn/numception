// @ts-check
// Supply check for AD-1 / AD-18: what dependency-cruiser can't see.
//
//  1. No banned package (tools/banned-packages.cjs) anywhere in pnpm-lock.yaml,
//     direct or transitive, imported or not.
//  2. No remote script, stylesheet, font, CSS url()/@import or JS import() URL in
//     packages/*/src, apps/client/src, apps/client/index.html or content/.
//
// Usage: node tools/check-supply.mjs [--root <dir>]
// Exits 1 and prints `file:line` or the package name for every finding.

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
/** @type {typeof import('./banned-packages.cjs')} */
const { matchBanned } = require('./banned-packages.cjs');

/** @typedef {{ name: string, pattern: string, group: string }} BannedHit */
/** @typedef {{ file: string, line: number, kind: string, text: string }} RemoteHit */

/** Strips quotes and the `(peer@x)` suffix from a lockfile key, then drops the `@version`. */
function nameFromPackageKey(/** @type {string} */ key) {
  const bare = key.replace(/^['"]|['"]$/g, '').split('(')[0] ?? '';
  const at = bare.lastIndexOf('@');
  return at > 0 ? bare.slice(0, at) : bare;
}

/**
 * Every package name the lockfile mentions: `packages:`/`snapshots:` keys and the
 * dependency entries of `importers:` and `snapshots:` (pnpm lockfile v9; handles
 * the multi-document form pnpm 11 writes).
 * @param {string} text
 * @returns {Set<string>}
 */
export function lockfilePackageNames(text) {
  const names = new Set();
  /** @type {string | undefined} */
  let section;
  /** @type {string | undefined} */
  let subsection;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === '' || raw.trimStart().startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    if (indent === 0) {
      section = line.endsWith(':') ? line.slice(0, -1) : undefined;
      continue;
    }
    const key = line.match(/^('[^']+'|"[^"]+"|[^\s:]+):/)?.[1];
    if (!key) continue;
    if (section === 'packages' || section === 'snapshots') {
      if (indent === 2) names.add(nameFromPackageKey(key));
      else if (indent === 4) subsection = key;
      else if (indent === 6 && section === 'snapshots' && subsection !== 'transitivePeerDependencies') {
        names.add(key.replace(/^['"]|['"]$/g, ''));
      }
    } else if (section === 'importers') {
      if (indent === 4) subsection = key;
      else if (indent === 6 && /dependencies$/i.test(subsection ?? '')) names.add(key.replace(/^['"]|['"]$/g, ''));
    }
  }
  names.delete('');
  return names;
}

/**
 * @param {string} lockfileText
 * @returns {BannedHit[]}
 */
export function findBannedInLockfile(lockfileText) {
  /** @type {BannedHit[]} */
  const hits = [];
  for (const name of [...lockfilePackageNames(lockfileText)].sort()) {
    const m = matchBanned(name);
    if (m) hits.push({ name, ...m });
  }
  return hits;
}

const REMOTE = String.raw`(?:https?:)?//`;
/**
 * Remote-load patterns, matched against the whole file so a tag or `import(` split
 * across lines is still caught (`[^>]*` and `\s*` span newlines).
 */
const REMOTE_PATTERNS = /** @type {const} */ ([
  ['script src', new RegExp(String.raw`<script\b[^>]*\bsrc\s*=\s*["']?${REMOTE}`, 'i')],
  ['link href', new RegExp(String.raw`<link\b[^>]*\bhref\s*=\s*["']?${REMOTE}`, 'i')],
  ['CSS @import', new RegExp(String.raw`@import\s+(?:url\(\s*)?["']?${REMOTE}`, 'i')],
  ['CSS url()', new RegExp(String.raw`\burl\(\s*["']?${REMOTE}`, 'i')],
  ['dynamic import()', new RegExp(String.raw`\bimport\s*\(\s*["'\`]${REMOTE}`)],
  ['static import', new RegExp(String.raw`\b(?:import|export)\b[^'"\`]*\bfrom\s*["']${REMOTE}`)],
  ['side-effect import', new RegExp(String.raw`^\s*import\s*["']${REMOTE}`, 'm')],
]);

/**
 * @param {string} text file contents
 * @param {string} file path reported in findings
 * @returns {RemoteHit[]}
 */
export function findRemoteLoads(text, file) {
  const lines = text.split(/\r?\n/);
  /** Line starts, for mapping a match offset to a 1-based line number. */
  const starts = [0];
  for (const m of text.matchAll(/\n/g)) starts.push(m.index + 1);
  /** @param {number} offset */
  const lineAt = (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if ((starts[mid] ?? 0) <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  /** First matching kind per line, in pattern order. @type {Map<number, string>} */
  const byLine = new Map();
  for (const [kind, re] of REMOTE_PATTERNS) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (const m of text.matchAll(global)) {
      // Report the line holding the URL (the match ends just after its `//`).
      const line = lineAt(m.index + m[0].length - 1);
      if (!byLine.has(line)) byLine.set(line, kind);
    }
  }
  return [...byLine.entries()]
    .sort(([a], [b]) => a - b)
    .map(([line, kind]) => ({ file, line, kind, text: (lines[line - 1] ?? '').trim() }));
}

const SCANNED_EXTENSIONS = /\.(?:[cm]?[jt]sx?|css|html?|svg|json|webmanifest)$/i;
const SKIPPED_DIRS = new Set(['node_modules', 'dist', '.tsbuild']);

/**
 * @param {string} dir
 * @returns {Generator<string>}
 */
function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile() && SCANNED_EXTENSIONS.test(entry.name)) {
      yield full;
    }
  }
}

/** The files the remote-load scan covers, relative to `root`. */
export function scannedFiles(/** @type {string} */ root) {
  /** @type {string[]} */
  const files = [];
  const packagesDir = join(root, 'packages');
  if (existsSync(packagesDir)) {
    for (const pkg of readdirSync(packagesDir).sort()) {
      const src = join(packagesDir, pkg, 'src');
      if (existsSync(src) && statSync(src).isDirectory()) files.push(...walk(src));
    }
  }
  files.push(...walk(join(root, 'apps', 'client', 'src')));
  const html = join(root, 'apps', 'client', 'index.html');
  if (existsSync(html)) files.push(html);
  files.push(...walk(join(root, 'content')));
  return files.map((f) => relative(root, f).split(sep).join('/'));
}

/**
 * Runs both checks against a repo root.
 * @param {string} root
 * @returns {{ banned: BannedHit[], remote: RemoteHit[], scanned: number }}
 */
export function checkSupply(root) {
  const lockfile = join(root, 'pnpm-lock.yaml');
  const banned = existsSync(lockfile) ? findBannedInLockfile(readFileSync(lockfile, 'utf8')) : [];
  const files = scannedFiles(root);
  const remote = files.flatMap((f) => findRemoteLoads(readFileSync(join(root, f), 'utf8'), f));
  return { banned, remote, scanned: files.length };
}

function main() {
  const args = process.argv.slice(2);
  const rootFlag = args.indexOf('--root');
  const root = rootFlag >= 0 && args[rootFlag + 1] ? args[rootFlag + 1] : process.cwd();
  if (!existsSync(join(root, 'pnpm-lock.yaml'))) {
    console.error(`check-supply: no pnpm-lock.yaml in ${root}`);
    process.exit(1);
  }
  const { banned, remote, scanned } = checkSupply(root);
  for (const b of banned) {
    console.error(`  error banned-package: ${b.name} is in pnpm-lock.yaml (matches '${b.pattern}', group ${b.group})`);
  }
  for (const r of remote) {
    console.error(`  error remote-load: ${r.file}:${r.line} ${r.kind}: ${r.text}`);
  }
  const total = banned.length + remote.length;
  if (total > 0) {
    console.error(`\nx check-supply: ${total} violation(s). See AD-1 / AD-18 and tools/banned-packages.cjs.`);
    process.exit(1);
  }
  console.log(`✔ check-supply: no banned packages in pnpm-lock.yaml, no remote loads in ${scanned} files`);
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

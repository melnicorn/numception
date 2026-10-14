// @ts-check
// Determinism check for AD-3: the generator and its PRNG read no ambient
// randomness, clock, float maths, crypto or locale. Fails on any of
// `Math.`, `uniformFloat`, `Date.now`, `performance.now`, `new Date`, `crypto.` or
// `Intl` in the non-test source of packages/core/src/generator/**,
// packages/core/src/random/**, packages/core/src/rounds/** (the round planner),
// packages/core/src/rules/**, packages/core/src/save/** (save documents and checksum)
// and packages/core/src/state/** (step and its reducers:
// time and entropy only from the envelope, AD-22), printing file:line for each.
// core/view and core/presentation are left out: they use float maths (progress,
// the Calm duration scale) and read no clock either.
//
// Comments are skipped (so docs may name what is banned); code and strings are not.
// `Math.` is banned outright, integer helpers included: node-stream.ts hand-writes
// its 32-bit multiply for this reason.
//
// Usage: node tools/check-core-purity.mjs [--root <dir>]   (run by `pnpm lint:deps`)

import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PURE_DIRS = [
  'packages/core/src/generator',
  'packages/core/src/random',
  'packages/core/src/rounds',
  'packages/core/src/rules',
  'packages/core/src/save',
  'packages/core/src/state',
];

/** @type {readonly { name: string, pattern: RegExp }[]} */
export const BANNED = [
  { name: 'Math.', pattern: /\bMath\s*\./ },
  { name: 'uniformFloat', pattern: /\buniformFloat/ },
  { name: 'Date.now', pattern: /\bDate\s*\.\s*now\b/ },
  { name: 'performance.now', pattern: /\bperformance\s*\.\s*now\b/ },
  { name: 'new Date', pattern: /\bnew\s+Date\b/ },
  { name: 'crypto.', pattern: /\bcrypto\s*\./ },
  { name: 'Intl', pattern: /\bIntl\b/ },
];

const SOURCE = /\.(?:[cm]?[jt]s|tsx|jsx)$/;
const TEST = /\.test\.[cm]?[jt]sx?$/;

/**
 * `code` with comments blanked out (newlines kept, so line numbers hold). Strings
 * and template literals are kept as code, so a banned name hidden in one still
 * counts.
 * @param {string} code
 */
export function stripComments(code) {
  let out = '';
  let i = 0;
  /** @type {string | undefined} */
  let quote;
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (ch === quote) quote = undefined;
      i += 1;
    } else if (ch === '/' && next === '/') {
      while (i < code.length && code[i] !== '\n') i += 1;
    } else if (ch === '/' && next === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') out += '\n';
        i += 1;
      }
      i += 2;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      out += ch;
      i += 1;
    }
  }
  return out;
}

/**
 * Banned uses in one file's source, as `{ line, name, text }` (1-based lines).
 * @param {string} code
 */
export function findBanned(code) {
  /** @type {{ line: number, name: string, text: string }[]} */
  const hits = [];
  const original = code.split('\n');
  stripComments(code)
    .split('\n')
    .forEach((text, i) => {
      for (const { name, pattern } of BANNED) {
        if (pattern.test(text)) hits.push({ line: i + 1, name, text: (original[i] ?? text).trim() });
      }
    });
  return hits;
}

/** @param {string} dir @returns {string[]} */
function sourceFiles(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (SOURCE.test(entry) && !TEST.test(entry)) files.push(path);
  }
  return files;
}

/**
 * Every banned use under the pure directories of `root`, as `file:line` findings.
 * @param {string} root
 * @returns {string[]}
 */
export function checkCorePurity(root) {
  /** @type {string[]} */
  const findings = [];
  for (const dir of PURE_DIRS) {
    const abs = join(root, dir);
    let files;
    try {
      files = sourceFiles(abs);
    } catch {
      findings.push(`${dir}: missing`);
      continue;
    }
    for (const file of files) {
      const rel = relative(root, file).split(sep).join('/');
      for (const hit of findBanned(readFileSync(file, 'utf8'))) {
        findings.push(`${rel}:${hit.line}: ${hit.name} is banned in core generation code (AD-3): ${hit.text}`);
      }
    }
  }
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  const root = rootIndex >= 0 && args[rootIndex + 1] ? args[rootIndex + 1] : join(fileURLToPath(import.meta.url), '..', '..');
  const findings = checkCorePurity(/** @type {string} */ (root));
  if (findings.length > 0) {
    for (const f of findings) console.error(f);
    console.error(`check-core-purity: ${findings.length} finding(s)`);
    process.exit(1);
  }
  console.log(`check-core-purity: ok (${PURE_DIRS.join(', ')})`);
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entry);
  } catch {
    return false;
  }
}

if (isMain()) main();

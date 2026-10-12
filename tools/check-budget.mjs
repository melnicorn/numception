// @ts-check
// Size budget for NFR-1, run after `pnpm build`: the initial web download must stay
// within 5 MB gzipped. The PWA flavours precache every file in the build on first
// load (NFR-2), so a flavour's initial download is its whole build: every file
// under apps/client/dist/<flavour>/, each gzipped at level 9 and summed.
//
// Usage: node tools/check-budget.mjs [--root <dir>]
// Prints a per-flavour table. Exits 1 naming every flavour over budget, or when no
// built flavour is found.

import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { FLAVOUR_NAMES } from '../apps/client/flavours.ts';

/** NFR-1: 5 MB gzipped, read as decimal megabytes (the stricter reading). */
export const BUDGET_BYTES = 5_000_000;

const DIST = 'apps/client/dist';

/** @typedef {{ flavour: string, files: number, rawBytes: number, gzipBytes: number }} BuildSize */

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
 * Gzip-9 size of one buffer.
 * @param {Buffer} data
 */
export function gzipSize(data) {
  return gzipSync(data, { level: 9 }).length;
}

/**
 * Sizes every file in a build directory.
 * @param {string} dir
 * @returns {{ files: number, rawBytes: number, gzipBytes: number }}
 */
export function measureBuild(dir) {
  let files = 0;
  let rawBytes = 0;
  let gzipBytes = 0;
  for (const file of walk(dir)) {
    const data = readFileSync(file);
    files += 1;
    rawBytes += data.length;
    gzipBytes += gzipSize(data);
  }
  return { files, rawBytes, gzipBytes };
}

/**
 * Measures each built flavour under `<root>/apps/client/dist/` against the budget.
 * Flavours that weren't built are skipped; finding none at all is an error.
 * @param {string} root
 * @param {number} [budget]
 * @returns {{ sizes: BuildSize[], errors: string[] }}
 */
export function checkBudget(root, budget = BUDGET_BYTES) {
  /** @type {BuildSize[]} */
  const sizes = [];
  /** @type {string[]} */
  const errors = [];
  for (const flavour of FLAVOUR_NAMES) {
    const dir = join(root, DIST, flavour);
    let isDir = false;
    try {
      isDir = statSync(dir).isDirectory();
    } catch {
      // Not built.
    }
    if (!isDir) continue;
    const size = { flavour, ...measureBuild(dir) };
    sizes.push(size);
    if (size.gzipBytes > budget) {
      errors.push(
        `${flavour}: ${formatBytes(size.gzipBytes)} gzipped exceeds the ${formatBytes(budget)} budget ` +
          `(${size.gzipBytes.toLocaleString('en-US')} > ${budget.toLocaleString('en-US')} bytes)`,
      );
    }
  }
  if (sizes.length === 0) errors.push(`no built flavour under ${DIST}/ (run pnpm build first)`);
  return { sizes, errors };
}

/**
 * Decimal megabytes, matching the budget's reading.
 * @param {number} bytes
 */
export function formatBytes(bytes) {
  return `${(bytes / 1_000_000).toFixed(3)} MB`;
}

/**
 * The per-flavour table printed by the CLI.
 * @param {BuildSize[]} sizes
 * @param {number} [budget]
 */
export function formatTable(sizes, budget = BUDGET_BYTES) {
  const rows = [
    ['flavour', 'files', 'raw', 'gzip-9', 'of budget'],
    ...sizes.map((s) => [
      s.flavour,
      String(s.files),
      formatBytes(s.rawBytes),
      formatBytes(s.gzipBytes),
      `${((s.gzipBytes / budget) * 100).toFixed(1)}%`,
    ]),
  ];
  const widths = rows[0]?.map((_, i) => Math.max(...rows.map((r) => (r[i] ?? '').length))) ?? [];
  return rows.map((r) => r.map((cell, i) => (i === 0 ? cell.padEnd(widths[i] ?? 0) : cell.padStart(widths[i] ?? 0))).join('  ')).join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const rootFlag = args.indexOf('--root');
  const root = rootFlag >= 0 && args[rootFlag + 1] ? args[rootFlag + 1] : process.cwd();
  const { sizes, errors } = checkBudget(root);
  if (sizes.length > 0) console.log(formatTable(sizes));
  for (const e of errors) console.error(`  error ${e}`);
  if (errors.length > 0) {
    console.error(`\nx check-budget: ${errors.length} finding(s). NFR-1 caps the initial web download at ${formatBytes(BUDGET_BYTES)} gzipped.`);
    process.exit(1);
  }
  console.log(`✔ check-budget: every built flavour is within ${formatBytes(BUDGET_BYTES)} gzipped (NFR-1)`);
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

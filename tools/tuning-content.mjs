// @ts-check
// The bundled tuning files (AD-7, FR-3): content/tuning/<tuningVersion>.json.
//
// - Every tuning file parses as a TuningConfig and is named after its tuningVersion.
// - Versions run 1..N with no gap.
// - content/tuning/shipped.json maps each shipped tuningVersion to the sha256 of
//   its file (as tools/golden-lock.mjs does for golden fixtures). A shipped tuning
//   file never disappears or changes, because recorded puzzles name it.
//
// Run by tools/tuning-content.test.ts (in `pnpm test`, so in CI) over the real
// directory and over temp directories. The parser is passed in, so this file
// needs no TypeScript import of core.

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The committed tuning directory. */
export const TUNING_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'tuning');

export const SHIPPED_FILE = 'shipped.json';

const TUNING_FILE = /^([1-9][0-9]*)\.json$/;

/**
 * @typedef {(json: unknown) => { ok: true, value: { tuningVersion: number } } | { ok: false, error: { message: string } }} ParseTuning
 */

/** @param {string} path hex sha256 of a file's bytes */
export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/**
 * Reads and validates `<dir>/shipped.json`: `{ shipped: { "<version>": "<sha256>" } }`.
 * @param {string} dir
 * @returns {{ ok: true, shipped: Map<number, string> } | { ok: false, error: string }}
 */
export function readShipped(dir) {
  const path = join(dir, SHIPPED_FILE);
  if (!existsSync(path)) return { ok: false, error: `${SHIPPED_FILE} is missing` };
  /** @type {unknown} */
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return { ok: false, error: `${SHIPPED_FILE} is not valid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return { ok: false, error: `${SHIPPED_FILE} must be an object` };
  const { shipped } = /** @type {{ shipped?: unknown }} */ (json);
  if (typeof shipped !== 'object' || shipped === null || Array.isArray(shipped)) {
    return { ok: false, error: `${SHIPPED_FILE} needs a "shipped" object mapping tuningVersion to sha256` };
  }
  /** @type {Map<number, string>} */
  const map = new Map();
  for (const [key, hash] of Object.entries(shipped)) {
    if (!/^[1-9][0-9]*$/.test(key) || typeof hash !== 'string' || !/^[0-9a-f]{64}$/.test(hash)) {
      return { ok: false, error: `${SHIPPED_FILE}: "shipped" entry ${JSON.stringify(key)} must map a tuningVersion to a lowercase hex sha256` };
    }
    map.set(Number(key), hash);
  }
  return { ok: true, shipped: map };
}

/**
 * Checks the tuning directory. Returns one message per problem, each naming the
 * file or version; an empty list means the content is sound.
 * @param {{ dir: string, parse: ParseTuning }} options
 * @returns {string[]}
 */
export function checkTuningContent({ dir, parse }) {
  /** @type {string[]} */
  const problems = [];
  /** @type {number[]} */
  const versions = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    if (file === SHIPPED_FILE) continue;
    const match = TUNING_FILE.exec(file);
    if (!match) {
      problems.push(`${file}: not a <tuningVersion>.json tuning file name`);
      continue;
    }
    const fileVersion = Number(match[1]);
    versions.push(fileVersion);
    /** @type {unknown} */
    let json;
    try {
      json = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    } catch (e) {
      problems.push(`${file}: not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const parsed = parse(json);
    if (!parsed.ok) problems.push(`${file}: ${parsed.error.message}`);
    else if (parsed.value.tuningVersion !== fileVersion) {
      problems.push(`${file}: tuningVersion ${parsed.value.tuningVersion} does not match the file name`);
    }
  }

  versions.sort((a, b) => a - b);
  if (versions.length === 0) problems.push('no tuning files: tuning v1 must be bundled');
  const gap = versions.findIndex((version, i) => version !== i + 1);
  if (gap !== -1) {
    problems.push(`tuning versions must run 1..N with no gap: ${gap + 1}.json is missing (found ${versions.join(', ')})`);
  }

  const shipped = readShipped(dir);
  if (!shipped.ok) problems.push(shipped.error);
  else {
    for (const [version, hash] of [...shipped.shipped].sort(([a], [b]) => a - b)) {
      const path = join(dir, `${version}.json`);
      if (!existsSync(path)) {
        problems.push(`tuning v${version} is shipped (${SHIPPED_FILE}) but ${version}.json is missing: a shipped tuning file is never removed`);
        continue;
      }
      const actual = sha256File(path);
      if (actual !== hash) {
        problems.push(
          `tuning v${version} is shipped (${SHIPPED_FILE}) but ${version}.json changed (sha256 ${actual}, recorded ${hash}): ` +
            'a shipped tuning file never changes; revert, and add the change as a new tuningVersion',
        );
      }
    }
  }
  return problems;
}

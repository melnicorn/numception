// @ts-check
// The shipped-fixture lock (AD-6): packages/core/test/fixtures/golden-seeds/shipped.lock.json
// maps each shipped generatorVersion to the sha256 of its fixture file. A shipped
// version's output never changes, so its fixture never changes either.
//
// Used by tools/golden-update.mjs (refuses to rewrite a locked fixture) and by
// tools/golden-lock.test.ts (fails when a locked fixture changed or a locked
// version is no longer registered).

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOCK_FILE = 'shipped.lock.json';

/** The committed fixture directory. */
export const GOLDEN_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'core', 'test', 'fixtures', 'golden-seeds');

/** @param {number} version */
export function fixtureFileName(version) {
  return `generator-v${version}.json`;
}

/** @param {string} path hex sha256 of a file's bytes */
export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/**
 * Reads and validates `<dir>/shipped.lock.json`.
 * @param {string} dir
 * @returns {{ ok: true, shipped: Map<number, string> } | { ok: false, error: string }}
 */
export function readLock(dir) {
  const path = join(dir, LOCK_FILE);
  if (!existsSync(path)) return { ok: false, error: `${path} is missing` };
  /** @type {unknown} */
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return { ok: false, error: `${path} is not valid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return { ok: false, error: `${path} must be an object` };
  const { shipped } = /** @type {{ shipped?: unknown }} */ (json);
  if (typeof shipped !== 'object' || shipped === null || Array.isArray(shipped)) {
    return { ok: false, error: `${path} needs a "shipped" object mapping generatorVersion to sha256` };
  }
  /** @type {Map<number, string>} */
  const map = new Map();
  for (const [key, hash] of Object.entries(shipped)) {
    if (!/^[1-9][0-9]*$/.test(key) || typeof hash !== 'string' || !/^[0-9a-f]{64}$/.test(hash)) {
      return { ok: false, error: `${path}: "shipped" entry ${JSON.stringify(key)} must map a generatorVersion to a lowercase hex sha256` };
    }
    map.set(Number(key), hash);
  }
  return { ok: true, shipped: map };
}

/**
 * Checks the lock in `dir` against the fixtures there and the registered versions.
 * Returns one message per problem, each naming the version.
 * @param {{ dir: string, registered: readonly number[] }} options
 * @returns {string[]}
 */
export function checkGoldenLock({ dir, registered }) {
  const lock = readLock(dir);
  if (!lock.ok) return [lock.error];
  /** @type {string[]} */
  const problems = [];
  for (const [version, hash] of [...lock.shipped].sort(([a], [b]) => a - b)) {
    const file = fixtureFileName(version);
    if (!registered.includes(version)) {
      problems.push(`v${version} is shipped (${LOCK_FILE}) but no longer registered: shipped versions stay registered forever`);
    }
    const path = join(dir, file);
    if (!existsSync(path)) {
      problems.push(`v${version} is shipped but ${file} is missing`);
      continue;
    }
    const actual = sha256File(path);
    if (actual !== hash) {
      problems.push(
        `v${version} is shipped but ${file} changed (sha256 ${actual}, locked ${hash}). ` +
          'A shipped generator never changes output: revert, and register a new generatorVersion for the change.',
      );
    }
  }
  return problems;
}

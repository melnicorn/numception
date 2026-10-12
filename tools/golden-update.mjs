// @ts-check
// `pnpm golden:update`: regenerates the golden-seed fixtures of registered
// generatorVersions that have not shipped (AD-6). It never touches a version in
// shipped.lock.json: asking for one is a refusal (exit 1, nothing written), and
// with nothing left to update it refuses too.
//
// Usage: node tools/golden-update.mjs [--version <N>]... [--dir <fixtures dir>]
//   --version  only these versions (default: every registered, unshipped version)
//   --dir      the fixture directory holding shipped.lock.json (default: the committed one)
//
// Core is TypeScript with extensionless imports, so the fixtures are built through
// Vite's module runner (runnerImport), the same transform Vitest uses.

import { realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOLDEN_DIR, LOCK_FILE, readLock } from './golden-lock.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = join(repoRoot, 'packages/core/test/golden/update-entry.ts');

/**
 * @param {string[]} args
 * @returns {{ dir: string, versions: number[] }}
 */
export function parseArgs(args) {
  let dir = GOLDEN_DIR;
  /** @type {number[]} */
  const versions = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const value = args[i + 1];
    if (arg === '--dir' && value !== undefined) {
      dir = resolve(value);
      i += 1;
    } else if (arg === '--version' && value !== undefined && /^[1-9][0-9]*$/.test(value)) {
      versions.push(Number(value));
      i += 1;
    } else {
      throw new Error(`unexpected argument ${JSON.stringify(arg)}. Usage: golden-update [--version <N>]... [--dir <dir>]`);
    }
  }
  return { dir, versions };
}

/**
 * Decides which versions to write. Pure, so the policy is testable without Vite.
 * @param {{ registered: readonly number[], shipped: ReadonlySet<number>, requested: readonly number[] }} input
 * @returns {{ ok: true, targets: number[], skipped: number[] } | { ok: false, error: string }}
 */
export function planUpdate({ registered, shipped, requested }) {
  if (requested.length > 0) {
    const unknown = requested.filter((v) => !registered.includes(v));
    if (unknown.length > 0) return { ok: false, error: `not registered: ${unknown.map((v) => `v${v}`).join(', ')}` };
    const locked = requested.filter((v) => shipped.has(v));
    if (locked.length > 0) {
      return {
        ok: false,
        error: `refusing to touch shipped ${locked.map((v) => `v${v}`).join(', ')} (${LOCK_FILE}): a shipped fixture never changes. Register a new generatorVersion instead.`,
      };
    }
    return { ok: true, targets: [...new Set(requested)].sort((a, b) => a - b), skipped: [] };
  }
  const targets = registered.filter((v) => !shipped.has(v));
  const skipped = registered.filter((v) => shipped.has(v));
  if (targets.length === 0) {
    return {
      ok: false,
      error: `refusing: every registered version (${registered.map((v) => `v${v}`).join(', ')}) is shipped (${LOCK_FILE}). Register a new generatorVersion to change output.`,
    };
  }
  return { ok: true, targets, skipped };
}

async function main() {
  const { dir, versions } = parseArgs(process.argv.slice(2));
  const lock = readLock(dir);
  if (!lock.ok) throw new Error(lock.error);

  const { runnerImport } = await import('vite');
  const { module } = /** @type {{ module: { registeredGeneratorVersions(): number[], buildFixture(v: number): { file: string, text: string } } }} */ (
    await runnerImport(ENTRY, { configFile: false, root: repoRoot, logLevel: 'error' })
  );

  const plan = planUpdate({ registered: module.registeredGeneratorVersions(), shipped: new Set(lock.shipped.keys()), requested: versions });
  if (!plan.ok) {
    console.error(`golden:update: ${plan.error}`);
    process.exit(1);
  }
  // Build every fixture before writing any, so a failure leaves the files unchanged.
  const built = plan.targets.map((v) => module.buildFixture(v));
  for (const { file, text } of built) {
    writeFileSync(join(dir, file), text);
    console.log(`golden:update: wrote ${join(dir, file)}`);
  }
  for (const v of plan.skipped) console.log(`golden:update: v${v} is shipped, left unchanged`);
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

if (isMain()) {
  main().catch((e) => {
    console.error(`golden:update: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
}

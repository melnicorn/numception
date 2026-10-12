// The shipped-fixture guard (AD-6) and `pnpm golden:update`'s refusal. The real
// lock starts empty (v1 is unshipped until epic-poc-playtest's first release), so
// the guard is exercised with temp locks outside the repo.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { registeredGeneratorVersions } from '../packages/core/src/generator/registered-generator-versions.ts';
import { checkGoldenLock, GOLDEN_DIR, LOCK_FILE, readLock, sha256File } from './golden-lock.mjs';
import { parseArgs, planUpdate } from './golden-update.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const updateScript = join(repoRoot, 'tools/golden-update.mjs');
const V1 = 'generator-v1.json';

const tempDirs: string[] = [];
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

/** A temp fixture dir holding a copy of the real v1 fixture and the given lock. */
function tempGoldenDir(shipped: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'numception-golden-'));
  tempDirs.push(dir);
  copyFileSync(join(GOLDEN_DIR, V1), join(dir, V1));
  writeFileSync(join(dir, LOCK_FILE), JSON.stringify({ comment: 'test', shipped }));
  return dir;
}

describe('the committed lock', () => {
  it('is valid', () => {
    expect(readLock(GOLDEN_DIR)).toMatchObject({ ok: true });
  });

  it('passes the guard', () => {
    expect(checkGoldenLock({ dir: GOLDEN_DIR, registered: registeredGeneratorVersions() })).toEqual([]);
  });

  it('carries a comment explaining the policy', () => {
    const lock = JSON.parse(readFileSync(join(GOLDEN_DIR, LOCK_FILE), 'utf8')) as { comment?: unknown };
    expect(typeof lock.comment).toBe('string');
  });
});

describe('checkGoldenLock', () => {
  it('passes when a locked fixture is unchanged', () => {
    const dir = tempGoldenDir({ 1: sha256File(join(GOLDEN_DIR, V1)) });
    expect(checkGoldenLock({ dir, registered: [1] })).toEqual([]);
  });

  it('fails naming v1 when its locked fixture changed', () => {
    const dir = tempGoldenDir({ 1: sha256File(join(GOLDEN_DIR, V1)) });
    writeFileSync(join(dir, V1), readFileSync(join(dir, V1), 'utf8').replace('"answerIndex":0', '"answerIndex":1'));
    const problems = checkGoldenLock({ dir, registered: [1] });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^v1 is shipped but generator-v1\.json changed/);
  });

  it('fails when a locked version is unregistered', () => {
    const dir = tempGoldenDir({ 1: sha256File(join(GOLDEN_DIR, V1)) });
    expect(checkGoldenLock({ dir, registered: [2] })).toEqual([
      `v1 is shipped (${LOCK_FILE}) but no longer registered: shipped versions stay registered forever`,
    ]);
  });

  it('fails when a locked fixture is missing', () => {
    const dir = tempGoldenDir({ 2: 'a'.repeat(64) });
    expect(checkGoldenLock({ dir, registered: [1, 2] })).toEqual(['v2 is shipped but generator-v2.json is missing']);
  });

  it('fails on a malformed or missing lock', () => {
    const dir = tempGoldenDir({ one: 'abc' });
    expect(checkGoldenLock({ dir, registered: [1] })[0]).toMatch(/must map a generatorVersion to a lowercase hex sha256/);
    rmSync(join(dir, LOCK_FILE));
    expect(checkGoldenLock({ dir, registered: [1] })[0]).toMatch(/shipped\.lock\.json is missing$/);
  });
});

describe('golden:update policy', () => {
  it('updates every unshipped version by default and skips shipped ones', () => {
    expect(planUpdate({ registered: [1, 2], shipped: new Set([1]), requested: [] })).toEqual({ ok: true, targets: [2], skipped: [1] });
  });

  it('refuses when every registered version is shipped', () => {
    expect(planUpdate({ registered: [1], shipped: new Set([1]), requested: [] })).toMatchObject({ ok: false });
  });

  it('refuses a requested shipped or unregistered version', () => {
    expect(planUpdate({ registered: [1, 2], shipped: new Set([1]), requested: [1, 2] })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/^refusing to touch shipped v1/),
    });
    expect(planUpdate({ registered: [1], shipped: new Set(), requested: [3] })).toEqual({ ok: false, error: 'not registered: v3' });
  });

  it('parses its arguments', () => {
    expect(parseArgs(['--version', '2', '--dir', '/tmp/x'])).toEqual({ dir: '/tmp/x', versions: [2] });
    expect(() => parseArgs(['--version', 'two'])).toThrow(/unexpected argument/);
  });
});

describe('golden:update script', () => {
  function run(dir: string): ReturnType<typeof spawnSync> {
    return spawnSync(process.execPath, [updateScript, '--dir', dir], { cwd: repoRoot, encoding: 'utf8' });
  }

  it('refuses while v1 is locked, exits non-zero and leaves the files unchanged', () => {
    const dir = tempGoldenDir({ 1: sha256File(join(GOLDEN_DIR, V1)) });
    // Make the fixture stale, so a rewrite would be visible.
    writeFileSync(join(dir, V1), 'stale');
    const result = run(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/refusing: every registered version \(v1\) is shipped/);
    expect(readFileSync(join(dir, V1), 'utf8')).toBe('stale');
  });

  it('rewrites an unshipped fixture byte for byte as committed', () => {
    const dir = tempGoldenDir({});
    writeFileSync(join(dir, V1), 'stale');
    const result = run(dir);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(readFileSync(join(dir, V1), 'utf8')).toBe(readFileSync(join(GOLDEN_DIR, V1), 'utf8'));
  });
});

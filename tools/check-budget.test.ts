// Tests for the size budget check. Fixtures are temp repos outside the repo.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { afterAll, describe, expect, it } from 'vitest';
import { BUDGET_BYTES, checkBudget, formatBytes, formatTable, gzipSize, measureBuild } from './check-budget.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'tools/check-budget.mjs');

const tempDirs: string[] = [];
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

/** A temp repo with the given files (paths relative to the root). */
function fixtureRepo(files: Record<string, string | Buffer>): string {
  const root = mkdtempSync(join(tmpdir(), 'numception-budget-'));
  tempDirs.push(root);
  for (const [file, data] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), data);
  }
  return root;
}

const small = {
  'apps/client/dist/dev/index.html': '<!doctype html><title>x</title>',
  'apps/client/dist/playtest/index.html': '<!doctype html><title>y</title>',
  'apps/client/dist/playtest/assets/index-abc.js': 'console.log("tracer");'.repeat(50),
};

describe('budget constant', () => {
  it('is 5 MB in decimal bytes (NFR-1, stricter reading)', () => {
    expect(BUDGET_BYTES).toBe(5_000_000);
  });
});

describe('measureBuild', () => {
  it('sums raw and gzip-9 sizes of every file, recursively', () => {
    const root = fixtureRepo(small);
    const js = Buffer.from('console.log("tracer");'.repeat(50));
    const html = Buffer.from('<!doctype html><title>y</title>');
    expect(measureBuild(join(root, 'apps/client/dist/playtest'))).toEqual({
      files: 2,
      rawBytes: js.length + html.length,
      gzipBytes: gzipSync(js, { level: 9 }).length + gzipSync(html, { level: 9 }).length,
    });
    expect(gzipSize(js)).toBe(gzipSync(js, { level: 9 }).length);
  });
});

describe('checkBudget', () => {
  it('passes builds within budget and skips flavours that were not built', () => {
    const { sizes, errors } = checkBudget(fixtureRepo(small));
    expect(errors).toEqual([]);
    expect(sizes.map((s) => s.flavour)).toEqual(['dev', 'playtest']);
  });

  it('names each flavour over budget with its size', () => {
    const { sizes, errors } = checkBudget(fixtureRepo(small), 80);
    const playtest = sizes.find((s) => s.flavour === 'playtest');
    expect(playtest?.gzipBytes).toBeGreaterThan(80);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^playtest: [\d.]+ MB gzipped exceeds the 0\.000 MB budget/);
    expect(errors[0]).toContain(`${playtest?.gzipBytes.toLocaleString('en-US')} > 80 bytes`);
  });

  it('fails when no flavour was built', () => {
    expect(checkBudget(fixtureRepo({ 'README.md': 'x' })).errors).toEqual([
      'no built flavour under apps/client/dist/ (run pnpm build first)',
    ]);
  });

  it('ignores directories that are not flavours', () => {
    const { sizes } = checkBudget(fixtureRepo({ ...small, 'apps/client/dist/other/x.js': 'x' }));
    expect(sizes.map((s) => s.flavour)).toEqual(['dev', 'playtest']);
  });
});

describe('formatting', () => {
  it('prints decimal megabytes and a per-flavour table', () => {
    expect(formatBytes(4_321_000)).toBe('4.321 MB');
    const table = formatTable([{ flavour: 'playtest', files: 3, rawBytes: 2_000_000, gzipBytes: 500_000 }]);
    expect(table.split('\n')).toHaveLength(2);
    expect(table).toMatch(/playtest\s+3\s+2\.000 MB\s+0\.500 MB\s+10\.0%/);
  });
});

describe('check-budget CLI', () => {
  it('exits 0 within budget, printing the table', () => {
    const ok = spawnSync(process.execPath, [script, '--root', fixtureRepo(small)], { encoding: 'utf8' });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toMatch(/flavour\s+files\s+raw\s+gzip-9/);
    expect(ok.stdout).toContain('check-budget');
  });

  it('exits 1 naming the flavour over the real 5,000,000-byte budget', () => {
    // Random bytes don't compress, so this is just over budget gzipped.
    const root = fixtureRepo({ ...small, 'apps/client/dist/playtest/zz.bin': randomBytes(BUDGET_BYTES + 1000) });
    const bad = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toMatch(/error playtest: 5\.\d{3} MB gzipped exceeds the 5\.000 MB budget/);
    expect(bad.stderr).not.toContain('error dev:');
  });
});

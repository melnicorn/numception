// Tests for the AD-3 purity check. Fixtures are temp trees outside the repo.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { checkCorePurity, findBanned, stripComments } from './check-core-purity.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'tools/check-core-purity.mjs');

const tempDirs: string[] = [];
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'numception-purity-'));
  tempDirs.push(root);
  for (const dir of ['packages/core/src/generator', 'packages/core/src/random']) mkdirSync(join(root, dir), { recursive: true });
  for (const [path, code] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), code);
  }
  return root;
}

describe('findBanned', () => {
  it.each([
    ['Math.random()', 'Math.'],
    ['const x = Math.floor(y);', 'Math.'],
    ['uniformFloat32(g)', 'uniformFloat'],
    ['const t = Date.now();', 'Date.now'],
    ['performance.now()', 'performance.now'],
    ['const d = new Date(0);', 'new Date'],
    ['crypto.getRandomValues(a)', 'crypto.'],
    ["new Intl.NumberFormat('en')", 'Intl'],
  ])('flags %s', (code, name) => {
    expect(findBanned(`const a = 1;\n${code}\n`)).toEqual([{ line: 2, name, text: code }]);
  });

  it('ignores comments but not strings', () => {
    expect(findBanned('// no Math.random here\n/* nor\n Date.now() */\nconst ok = 1;\n')).toEqual([]);
    expect(findBanned("const s = 'Math.random';")).toHaveLength(1);
  });

  it('does not flag look-alike names', () => {
    expect(findBanned('const myMath = 1; const IntlLike = 2; const x = mathFloor(1);')).toEqual([]);
  });
});

describe('stripComments', () => {
  it('keeps line numbers and string contents', () => {
    expect(stripComments('a /* x\ny */ b // c\n"// d"')).toBe('a \n b \n"// d"');
  });
});

describe('checkCorePurity', () => {
  it('passes the real core', () => {
    expect(checkCorePurity(repoRoot)).toEqual([]);
  });

  it('fails at file:line for a planted Math.random(), skipping tests and other dirs', () => {
    const root = tree({
      'packages/core/src/generator/v1/realise-v1.ts': 'export const a = 1;\nexport const b = Math.random();\n',
      'packages/core/src/generator/v1/realise-v1.test.ts': 'Math.random();\n',
      'packages/core/src/random/next-int.ts': 'export const c = 1;\n',
      'packages/core/src/numbers/rational.ts': 'Math.random();\n',
    });
    expect(checkCorePurity(root)).toEqual([
      'packages/core/src/generator/v1/realise-v1.ts:2: Math. is banned in core generation code (AD-3): export const b = Math.random();',
    ]);
  });

  it('exits 1 and prints file:line from the command line', () => {
    const root = tree({ 'packages/core/src/random/node-stream.ts': '\n\nconst t = Date.now();\n' });
    const result = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('packages/core/src/random/node-stream.ts:3: Date.now');
  });

  it('exits 0 on the real core', () => {
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
  });
});

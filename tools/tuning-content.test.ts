// The bundled tuning files (AD-7): every content/tuning/<tuningVersion>.json is a
// valid TuningConfig for this build named after its tuningVersion, versions run
// 1..N with no gap, and no shipped version (content/tuning/shipped.json) is missing
// or changed (sha256).
// The real shipped list starts empty (v1 is unshipped until epic-poc-playtest's
// first release), so the rules are exercised with temp directories.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parseTuning } from '../packages/core/src/index.ts';
import { checkTuningContent, readShipped, SHIPPED_FILE, sha256File, TUNING_DIR } from './tuning-content.mjs';

const realV1 = JSON.parse(readFileSync(join(TUNING_DIR, '1.json'), 'utf8')) as { tuningVersion: number };

const tempDirs: string[] = [];
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

const fakeHash = 'a'.repeat(64);

/**
 * A temp tuning dir holding copies of v1 renumbered to `versions`, with `shipped`
 * recorded at each file's real sha256 (or `fakeHash` for a version with no file).
 */
function tempTuningDir(versions: number[], shipped: number[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'numception-tuning-'));
  tempDirs.push(dir);
  for (const v of versions) writeFileSync(join(dir, `${v}.json`), JSON.stringify({ ...realV1, tuningVersion: v }));
  const hashes = Object.fromEntries(shipped.map((v) => [v, versions.includes(v) ? sha256File(join(dir, `${v}.json`)) : fakeHash]));
  writeFileSync(join(dir, SHIPPED_FILE), JSON.stringify({ comment: 'test', shipped: hashes }));
  return dir;
}

const check = (dir: string) => checkTuningContent({ dir, parse: parseTuning });

describe('content/tuning', () => {
  it('passes the check', () => {
    expect(check(TUNING_DIR)).toEqual([]);
  });

  it('bundles tuning v1 as a valid TuningConfig', () => {
    expect(realV1.tuningVersion).toBe(1);
    const parsed = parseTuning(realV1);
    expect(parsed.ok ? 'ok' : parsed.error.message).toBe('ok');
  });

  it('keeps v1 and retunes the round change to about 900 ms in v2, the latest (AD-7)', () => {
    const v2 = parseTuning(JSON.parse(readFileSync(join(TUNING_DIR, '2.json'), 'utf8')));
    expect(v2.ok && v2.value.tuningVersion).toBe(2);
    expect(v2.ok && v2.value.presentation.roundTransitionMs).toBe(900);
    const v1 = parseTuning(realV1);
    expect(v1.ok && v1.value.presentation.roundTransitionMs).toBe(400);
    // Only the round change moved: v2 is v1 with a new version and duration.
    const raw2 = JSON.parse(readFileSync(join(TUNING_DIR, '2.json'), 'utf8')) as Record<string, unknown> & { presentation: object };
    const raw1 = realV1 as unknown as Record<string, unknown> & { presentation: object };
    expect({ ...raw2, tuningVersion: 1, presentation: { ...raw2.presentation, roundTransitionMs: 400 } }).toEqual(raw1);
  });

  it('enables + and − only, never × or ÷ (FR-3 POC)', () => {
    const parsed = parseTuning(realV1);
    expect(parsed.ok && parsed.value.generation.operators).toEqual(['add', 'sub']);
  });

  it('has a shipped list with a comment explaining the policy', () => {
    expect(readShipped(TUNING_DIR)).toMatchObject({ ok: true });
    const json = JSON.parse(readFileSync(join(TUNING_DIR, SHIPPED_FILE), 'utf8')) as { comment?: unknown };
    expect(typeof json.comment).toBe('string');
  });
});

describe('checkTuningContent', () => {
  it('passes 1..3 with 1 and 2 shipped', () => {
    expect(check(tempTuningDir([1, 2, 3], [1, 2]))).toEqual([]);
  });

  it('fails naming version 1 when shipped v1 is removed', () => {
    const dir = tempTuningDir([], [1]);
    const problems = check(dir);
    expect(problems.some((p) => /^tuning v1 is shipped \(shipped\.json\) but 1\.json is missing/.test(p))).toBe(true);
  });

  it('fails naming a removed shipped version among others', () => {
    const dir = tempTuningDir([1, 2], [1, 3]);
    expect(check(dir)).toEqual([expect.stringMatching(/^tuning v3 is shipped .* 3\.json is missing/)]);
  });

  it('fails naming the version when a shipped file changed', () => {
    const dir = tempTuningDir([1, 2], [1]);
    writeFileSync(join(dir, '1.json'), JSON.stringify({ ...realV1, tuningVersion: 1 }, null, 2));
    expect(check(dir)).toEqual([expect.stringMatching(/^tuning v1 is shipped \(shipped\.json\) but 1\.json changed \(sha256 [0-9a-f]{64}, recorded [0-9a-f]{64}\)/)]);
  });

  it('lets an unshipped file change', () => {
    const dir = tempTuningDir([1, 2], [1]);
    writeFileSync(join(dir, '2.json'), JSON.stringify({ ...realV1, tuningVersion: 2 }, null, 2));
    expect(check(dir)).toEqual([]);
  });

  it('fails on a gap', () => {
    expect(check(tempTuningDir([1, 3]))).toEqual([expect.stringMatching(/no gap: 2\.json is missing \(found 1, 3\)/)]);
  });

  it('fails when versions do not start at 1', () => {
    expect(check(tempTuningDir([2]))).toEqual([expect.stringMatching(/no gap: 1\.json is missing/)]);
  });

  it('fails with no tuning files', () => {
    expect(check(tempTuningDir([]))).toEqual(['no tuning files: tuning v1 must be bundled']);
  });

  it('fails when a file is named after another version', () => {
    const dir = tempTuningDir([1]);
    writeFileSync(join(dir, '2.json'), JSON.stringify(realV1));
    expect(check(dir)).toEqual(['2.json: tuningVersion 1 does not match the file name']);
  });

  it('fails when a file does not parse as a TuningConfig, with its error', () => {
    const dir = tempTuningDir([1]);
    const bad = { ...realV1, generation: { ...(realV1 as unknown as { generation: object }).generation, operators: ['add', 'mul'] } };
    writeFileSync(join(dir, '1.json'), JSON.stringify(bad));
    expect(check(dir)).toEqual([expect.stringMatching(/^1\.json: Invalid TuningConfig: generation\.operators\.1: /)]);
  });

  it('fails on invalid JSON and on a stray file name', () => {
    const dir = tempTuningDir([1]);
    writeFileSync(join(dir, '2.json'), '{');
    writeFileSync(join(dir, 'v3.json'), '{}');
    const problems = check(dir);
    expect(problems).toContainEqual(expect.stringMatching(/^2\.json: not valid JSON/));
    expect(problems).toContainEqual('v3.json: not a <tuningVersion>.json tuning file name');
  });

  it.each([
    ['missing shipped.json', null],
    ['an array shipped', { shipped: [1] }],
    ['a non-integer version', { shipped: { '1.5': fakeHash } }],
    ['version 0', { shipped: { 0: fakeHash } }],
    ['a non-hex hash', { shipped: { 1: 'z'.repeat(64) } }],
    ['an uppercase hash', { shipped: { 1: 'A'.repeat(64) } }],
  ])('fails on %s', (_name, shippedJson) => {
    const dir = tempTuningDir([1]);
    if (shippedJson === null) rmSync(join(dir, SHIPPED_FILE));
    else writeFileSync(join(dir, SHIPPED_FILE), JSON.stringify(shippedJson));
    expect(check(dir)).toEqual([expect.stringMatching(/^shipped\.json/)]);
  });
});

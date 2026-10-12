// The bundled tuning files (AD-7): every content/tuning/<tuningVersion>.json is a
// valid TuningConfig for this build, and its tuningVersion matches its file name.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseTuning } from '../packages/core/src/index.ts';

const tuningDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'tuning');
const files = readdirSync(tuningDir).filter((f) => f.endsWith('.json')).sort();

describe('content/tuning', () => {
  it('bundles tuning v1', () => {
    expect(files).toContain('1.json');
  });

  it.each(files)('%s is a valid TuningConfig named after its tuningVersion', (file) => {
    const result = parseTuning(JSON.parse(readFileSync(join(tuningDir, file), 'utf8')));
    expect(result.ok ? 'ok' : result.error.message).toBe('ok');
    if (result.ok) expect(`${result.value.tuningVersion}.json`).toBe(file);
  });
});

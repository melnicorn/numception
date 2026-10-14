// The bundled transitions (AD-15, FR-26): every content/transitions/<transitionId>.json
// is a valid Transition named after its id; the calm set and the Minimal crossfade
// ship, none flashes more than 3 times a second (AD-23), and each one's audio cue is
// a cue the feedback director knows.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseTransition, type Transition } from '../packages/core/src/index.ts';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'transitions');
const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();

function load(file: string): Transition {
  const parsed = parseTransition(JSON.parse(readFileSync(join(DIR, file), 'utf8')) as unknown);
  if (!parsed.ok) throw new Error(`${file}: ${parsed.error.message}`);
  return parsed.value;
}

describe('content/transitions', () => {
  it('bundles the Minimal crossfade and the calm set, each valid and named after its transitionId', () => {
    expect(files).toEqual(['crossfade.json', 'fade.json', 'interpolate.json', 'ripple.json', 'snow.json']);
    for (const f of files) expect(`${load(f).transitionId}.json`).toBe(f);
    expect(files.map((f) => load(f).tag)).toEqual(['calm', 'calm', 'calm', 'calm', 'calm']);
    expect(load('ripple.json').start).toBe('on-tap');
  });

  it('flashes at most 3 times a second, and cues only the whoosh', () => {
    for (const f of files) {
      const t = load(f);
      expect(t.maxFlashesPerSecond).toBeLessThanOrEqual(3);
      expect([null, 'whoosh']).toContain(t.audioCue);
    }
  });
});

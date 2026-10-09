import { describe, expect, it } from 'vitest';
import { basePath } from './base-path.ts';

describe('basePath', () => {
  it('defaults to / when BASE_PATH is unset or blank', () => {
    expect(basePath('')).toBe('/');
    expect(basePath('  ')).toBe('/');
  });

  it('normalises a repo subpath to /name/', () => {
    expect(basePath('/numception/')).toBe('/numception/');
    expect(basePath('numception')).toBe('/numception/');
  });
});

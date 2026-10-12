import { describe, expect, it } from 'vitest';
import { GENERATOR_VERSION } from './generator-version';
import { GENERATORS } from './registry';
import { realiseV1 } from './v1/realise-v1';

describe('GENERATORS', () => {
  it('registers v1 with its implementation', () => {
    expect(GENERATORS[1]).toBe(realiseV1);
  });

  it("registers this build's current GENERATOR_VERSION", () => {
    expect(Object.hasOwn(GENERATORS, GENERATOR_VERSION)).toBe(true);
  });

  it('is frozen, so nothing registers a version at run time', () => {
    expect(Object.isFrozen(GENERATORS)).toBe(true);
  });
});

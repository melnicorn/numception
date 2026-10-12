import { describe, expect, it } from 'vitest';
import { registeredGeneratorVersions } from './registered-generator-versions';

describe('registeredGeneratorVersions', () => {
  it('lists the registered versions as ascending numbers', () => {
    expect(registeredGeneratorVersions()).toEqual([1]);
  });
});

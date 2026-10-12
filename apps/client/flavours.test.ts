import { describe, expect, it } from 'vitest';
import { FLAVOUR_NAMES, FLAVOURS, flavourOutDir, resolveFlavour } from './flavours.ts';

describe('flavour table', () => {
  it('has the three flavours with the AD-18 ids', () => {
    expect(Object.keys(FLAVOURS)).toEqual([...FLAVOUR_NAMES]);
    expect(FLAVOURS.dev).toMatchObject({ appId: 'app.numception.dev', appName: 'Numception Dev', devPanel: true });
    expect(FLAVOURS.playtest).toMatchObject({
      appId: 'app.numception.playtest',
      appName: 'Numception Playtest',
      devPanel: true,
    });
    expect(FLAVOURS.prod).toMatchObject({ appId: 'app.numception', appName: 'Numception', devPanel: false });
  });

  it('gives every flavour a distinct appId and name', () => {
    const all = Object.values(FLAVOURS);
    expect(new Set(all.map((f) => f.appId)).size).toBe(all.length);
    expect(new Set(all.map((f) => f.appName)).size).toBe(all.length);
    for (const [key, f] of Object.entries(FLAVOURS)) expect(f.name).toBe(key);
  });
});

describe('resolveFlavour', () => {
  it('defaults to dev when FLAVOUR is unset or empty', () => {
    expect(resolveFlavour({}).name).toBe('dev');
    expect(resolveFlavour({ FLAVOUR: '' }).name).toBe('dev');
    expect(resolveFlavour({ FLAVOUR: '  ' }).name).toBe('dev');
  });

  it('resolves each named flavour', () => {
    for (const name of FLAVOUR_NAMES) expect(resolveFlavour({ FLAVOUR: name })).toBe(FLAVOURS[name]);
  });

  it('rejects an unknown flavour, naming the valid ones', () => {
    expect(() => resolveFlavour({ FLAVOUR: 'staging' })).toThrow(
      'Unknown FLAVOUR="staging". Expected one of: dev, playtest, prod',
    );
    // Inherited Object.prototype keys are not flavours.
    expect(() => resolveFlavour({ FLAVOUR: 'constructor' })).toThrow('Unknown FLAVOUR="constructor"');
    expect(() => resolveFlavour({ FLAVOUR: 'toString' })).toThrow('Unknown FLAVOUR="toString"');
  });

  it('puts each build in dist/<flavour>', () => {
    expect(flavourOutDir(FLAVOURS.playtest)).toBe('dist/playtest');
  });
});

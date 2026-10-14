import type { HapticKind } from '@numception/app';
import type { ImpactOptions } from '@capacitor/haptics';
import { describe, expect, it } from 'vitest';
import { type HapticsPluginLike, nativeHaptics } from './native-haptics';

function fakePlugin(impact: (options?: ImpactOptions) => Promise<void> = () => Promise.resolve()): HapticsPluginLike & { calls: (ImpactOptions | undefined)[] } {
  const calls: (ImpactOptions | undefined)[] = [];
  return {
    calls,
    impact: (options) => {
      calls.push(options);
      return impact(options);
    },
  };
}

describe('nativeHaptics', () => {
  it('plays each kind as its Capacitor impact style, soft as the lightest', () => {
    const plugin = fakePlugin();
    const haptics = nativeHaptics(plugin);
    for (const kind of ['light', 'medium', 'heavy', 'soft'] satisfies HapticKind[]) haptics.impact(kind);
    expect(plugin.calls).toEqual([{ style: 'LIGHT' }, { style: 'MEDIUM' }, { style: 'HEAVY' }, { style: 'LIGHT' }]);
  });

  it('never throws: a rejected or thrown plugin error is ignored', async () => {
    const rejecting = fakePlugin(() => Promise.reject(new Error('not available')));
    expect(() => nativeHaptics(rejecting).impact('light')).not.toThrow();
    const throwing = fakePlugin(() => {
      throw new Error('bridge gone');
    });
    expect(() => nativeHaptics(throwing).impact('light')).not.toThrow();
    // Let the rejection settle: an unhandled one would fail the run.
    for (let k = 0; k < 3; k += 1) await Promise.resolve();
    expect(rejecting.calls).toHaveLength(1);
    expect(throwing.calls).toHaveLength(1);
  });
});

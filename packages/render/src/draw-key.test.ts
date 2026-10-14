import type { PlayVM } from '@numception/app';
import { describe, expect, it } from 'vitest';
import { drawKey } from './draw-key';

const vm = {
  nodeId: { tier: 1, index: 0 },
  kind: 'puzzle',
  shapeId: '3A',
  aspect: 1,
  cells: [{ index: 0, polygon: [], labelPoint: [0.5, 0.5], inscribedRadius: 0.1, text: '3', state: 'unsolved', enters: null }],
  operator: { polygon: [], labelPoint: [0.5, 0.5], symbol: '+' },
  inputLocked: false,
  presentation: { kind: 'idle', progress: 1, durationMs: 0, transitionId: 'none' },
  theme: { themeId: 'kiln' },
} as unknown as PlayVM;

describe('drawKey', () => {
  it('ignores the presentation timeline but not what is drawn', () => {
    const locked: PlayVM = { ...vm, inputLocked: true, presentation: { kind: 'solve', progress: 0.4, durationMs: 475, transitionId: 'default' } };
    expect(drawKey(locked)).toBe(drawKey(vm));
    expect(drawKey({ ...vm, nodeId: { tier: 1, index: 1 } })).not.toBe(drawKey(vm));
    expect(drawKey({ ...vm, kind: 'overview' })).not.toBe(drawKey(vm));
    expect(drawKey(null)).not.toBe(drawKey(vm));
  });
});

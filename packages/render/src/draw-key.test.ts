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
  solvedAnswer: null,
  inputLocked: false,
  presentation: { kind: 'idle', progress: 1, durationMs: 0, transitionId: 'none', cellIndex: null },
  theme: { themeId: 'kiln' },
} as unknown as PlayVM;

describe('drawKey', () => {
  it('changes with what is drawn, and with every step of a running beat', () => {
    const solving = (progress: number): PlayVM => ({
      ...vm,
      inputLocked: true,
      presentation: { kind: 'solve', progress, durationMs: 475, transitionId: 'default', cellIndex: 0 },
    });
    expect(drawKey(solving(0.4))).toBe(drawKey(solving(0.4)));
    expect(drawKey(solving(0.4))).not.toBe(drawKey(solving(0.5)));
    expect(drawKey(solving(0.4))).not.toBe(drawKey(vm));
    expect(drawKey({ ...solving(0.4), presentation: { ...solving(0.4).presentation, transitionId: 'other' } })).not.toBe(drawKey(solving(0.4)));
    expect(drawKey({ ...vm, nodeId: { tier: 1, index: 1 } })).not.toBe(drawKey(vm));
    expect(drawKey({ ...vm, kind: 'overview' })).not.toBe(drawKey(vm));
    expect(drawKey(null)).not.toBe(drawKey(vm));
  });

  it('ignores inputLocked and idle timing', () => {
    expect(drawKey({ ...vm, inputLocked: true })).toBe(drawKey(vm));
    expect(drawKey({ ...vm, presentation: { ...vm.presentation, durationMs: 5 } })).toBe(drawKey(vm));
  });
});

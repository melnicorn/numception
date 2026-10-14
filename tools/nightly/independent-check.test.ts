import { describe, expect, it } from 'vitest';
import { puzzleProblems, roundProblems } from './independent-check.mjs';

describe('puzzleProblems', () => {
  it('accepts a valid + and − puzzle', () => {
    expect(puzzleProblems({ values: [4, 12, 16, 30, 7], operator: 'add', answerIndex: 2 })).toEqual([]);
    expect(puzzleProblems({ values: [4, 12, 16, 30, 7], operator: 'sub', answerIndex: 0 })).toEqual([]);
  });
  it.each([
    ['two triples', { values: [1, 2, 3, 5], operator: 'add' as const, answerIndex: 2 }, /2 valid triples/],
    ['no triple', { values: [1, 2, 4, 8], operator: 'add' as const, answerIndex: 2 }, /0 valid triples/],
    ['duplicates', { values: [4, 4, 8], operator: 'add' as const, answerIndex: 2 }, /duplicate/],
    ['zero', { values: [0, 3, 3, 9], operator: 'add' as const, answerIndex: 2 }, /non-positive/],
    ['wrong + answer', { values: [4, 12, 16], operator: 'add' as const, answerIndex: 0 }, /expected the sum cell 2/],
    ['wrong − answer', { values: [4, 12, 16], operator: 'sub' as const, answerIndex: 2 }, /two smaller cells/],
  ])('rejects %s', (_name, p, msg) => {
    expect(puzzleProblems(p).join('\n')).toMatch(msg);
  });
});

describe('roundProblems', () => {
  // Classic n=3: top [3, 5, 8] (3 + 5 = 8, answer 8); leaves answer 3, 5, 8.
  const nodes = [
    { tier: 2, index: 0, values: [3, 5, 8], answerIndex: 2 },
    { tier: 1, index: 0, contract: 3 },
    { tier: 1, index: 1, contract: 5 },
    { tier: 1, index: 2, contract: 8 },
  ];
  // Leaves: 1 + 2 = 3, 1 + 4 = 5, 3 + 5 = 8 (answer last).
  const leaves = [
    { values: [1, 2, 3], answerIndex: 2 },
    { values: [1, 4, 5], answerIndex: 2 },
    { values: [3, 5, 8], answerIndex: 2 },
  ];
  it('accepts a consistent round', () => {
    expect(roundProblems({ n: 3, operator: 'add', tiers: 2, nodes, leafPuzzle: (i) => leaves[i] })).toEqual([]);
  });
  it('rejects a leaf puzzle with extra triples even when its answer matches', () => {
    const bad = (i: number) => (i === 2 ? { values: [3, 5, 8, 2, 6], answerIndex: 2 } : leaves[i]);
    expect(roundProblems({ n: 3, operator: 'add', tiers: 2, nodes, leafPuzzle: bad }).join('\n')).toMatch(/leaf 1\/2: 3 valid triples/);
  });
  it('rejects a child contract that differs from its parent cell', () => {
    const bad = nodes.map((x) => (x.tier === 1 && x.index === 1 ? { ...x, contract: 6 } : x));
    const leafPuzzle = (i: number) => (i === 1 ? { values: [1, 5, 6], answerIndex: 2 } : leaves[i]);
    expect(roundProblems({ n: 3, operator: 'add', tiers: 2, nodes: bad, leafPuzzle }).join('\n')).toMatch(/contract 6, parent cell 5/);
  });
  it('rejects a leaf that realises the wrong answer and a missing node', () => {
    const r = roundProblems({ n: 3, operator: 'add', tiers: 2, nodes: nodes.slice(0, 3), leafPuzzle: (i) => (i === 0 ? { values: [1, 3, 4], answerIndex: 2 } : leaves[i]) });
    expect(r.join('\n')).toMatch(/3 nodes, expected 4/);
    expect(r.join('\n')).toMatch(/leaf 1\/0 realises answer 4, contract 3/);
    expect(r.join('\n')).toMatch(/child 2 missing/);
  });
});

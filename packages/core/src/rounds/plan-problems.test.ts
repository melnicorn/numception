import { describe, expect, it } from 'vitest';
import { rational } from '../numbers/rational';
import { parseTuning } from '../tuning/parse-tuning';
import { roundPlanProblems } from './plan-problems';
import type { RoundPlan, RoundPlanNode } from './round-plan';
import { planRound } from './round-types';

const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 9 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 9, minValue: 1, maxValue: 99, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25, softMissMs: 600 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

function towerPlan(): RoundPlan {
  const result = planRound({ type: 'tower', n: 3, operator: 'add' }, tuning, 11, { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function withNode(plan: RoundPlan, i: number, change: (node: RoundPlanNode) => RoundPlanNode): RoundPlan {
  return { ...plan, nodes: plan.nodes.map((node, j) => (j === i ? change(node) : node)) };
}

describe('roundPlanProblems', () => {
  it('passes a planned round', () => {
    expect(roundPlanProblems(towerPlan(), tuning)).toEqual([]);
  });

  it('catches a missing node, a duplicate and a broken order', () => {
    const plan = towerPlan();
    expect(roundPlanProblems({ ...plan, nodes: plan.nodes.slice(0, -1) }, tuning)).toContain('12 nodes, not 13');
    const dup = roundPlanProblems({ ...plan, nodes: [...plan.nodes.slice(0, -1), plan.nodes[1]!] }, tuning);
    expect(dup.some((p) => p.includes('appears twice'))).toBe(true);
    expect(dup.some((p) => p.includes('out of top-down order'))).toBe(true);
  });

  it("catches a child contract that isn't its parent's cell", () => {
    const plan = towerPlan();
    const leaf = plan.nodes.findIndex((n) => n.nodeId.tier === 1);
    const problems = roundPlanProblems(
      withNode(plan, leaf, (n) => ({ ...n, contract: n.contract! + 1 })),
      tuning,
    );
    expect(problems.some((p) => p.startsWith('node (1, 0): contract'))).toBe(true);
  });

  it('catches a puzzle with a second valid triple or a wrong answer', () => {
    const plan = towerPlan();
    const top = plan.nodes[0]!.puzzle!;
    const values = top.cells.map((c) => c.n);
    // Duplicating a cell value breaks distinctness; the second triple check follows from the cells.
    const broken = withNode(plan, 0, (n) => ({ ...n, puzzle: { ...top, cells: [rational(values[1]!), ...top.cells.slice(1)] } }));
    expect(roundPlanProblems(broken, tuning).some((p) => p.startsWith('node (3, 0):'))).toBe(true);
    const wrongAnswer = withNode(plan, 0, (n) => ({ ...n, puzzle: { ...top, answerIndex: top.roles.a } }));
    expect(roundPlanProblems(wrongAnswer, tuning)).toContain(`node (3, 0): answerIndex ${top.roles.a} is not roles.c ${top.roles.c}`);
  });

  it('catches a leaf contract that does not realise in band 1, and a leaf carrying a puzzle', () => {
    const plan = towerPlan();
    const leaf = plan.nodes.findIndex((n) => n.nodeId.tier === 1);
    const tier2 = plan.nodes[1]!;
    // Contract 1000 is outside band 1 (and no longer the parent's cell, reported separately).
    const unrealisable = roundPlanProblems(withNode(plan, leaf, (n) => ({ ...n, contract: 1000 })), tuning);
    expect(unrealisable).toContain('node (1, 0): contract 1000 does not realise in band 1: unrealisable');
    const withPuzzle = roundPlanProblems(withNode(plan, leaf, (n) => ({ ...n, puzzle: tier2.puzzle! })), tuning);
    expect(withPuzzle).toContain('node (1, 0): a leaf carries a puzzle (leaves are realised lazily)');
  });

  it('catches a fixed top cell that is not where the plan says, and an unknown type', () => {
    const plan = towerPlan();
    const v = plan.nodes[0]!.puzzle!.cells[0]!.n;
    expect(roundPlanProblems({ ...plan, fixedTopCell: { childIndex: 0, value: v } }, tuning)).toEqual([]);
    expect(roundPlanProblems({ ...plan, fixedTopCell: { childIndex: 1, value: v } }, tuning)).toEqual([`top cell 1 is not the fixed value ${v}`]);
    expect(roundPlanProblems({ ...plan, tiers: 2 }, tuning)).toHaveLength(1);
  });
});

// An independent consistency check of a RoundPlan (FR-2): every rule the planner
// promises, re-derived from the plan's cells with its own brute force rather than
// the generator's helpers. Used by the round tests and the content acceptance test
// (tools/round-content.test.ts); not exported from the package index. Integer-only
// (AD-3).
import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import { realise } from '../generator/realise';
import { specFor } from '../spec/spec-for';
import type { TuningConfig } from '../tuning/tuning-config';
import { LEAF_CHECK_BAND } from './plan-tiers';
import type { RoundPlan, RoundPlanNode } from './round-plan';
import { compareTopDown, nodeCount, parentOf, tierWidth } from './round-node-id';
import { ROUND_TYPES } from './round-types';

/** Cell index triples (i < j < k) where one value is the sum of the other two. */
function validTriples(values: readonly number[]): number[][] {
  const found: number[][] = [];
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      for (let k = j + 1; k < values.length; k += 1) {
        const x = values[i]!;
        const y = values[j]!;
        const z = values[k]!;
        if (x + y === z || x + z === y || y + z === x) found.push([i, j, k]);
      }
    }
  }
  return found;
}

function label(id: NodeId): string {
  return `(${id.tier}, ${id.index})`;
}

/** What is wrong with one upper-tier puzzle, as messages. */
function puzzleProblems(plan: RoundPlan, node: RoundPlanNode, puzzle: Puzzle): string[] {
  const at = `node ${label(node.nodeId)}`;
  const problems: string[] = [];
  if (puzzle.nodeId.tier !== node.nodeId.tier || puzzle.nodeId.index !== node.nodeId.index) problems.push(`${at}: puzzle is for ${label(puzzle.nodeId)}`);
  if (puzzle.spec.operator !== plan.operator || puzzle.spec.n !== plan.n) problems.push(`${at}: puzzle is not ${plan.operator} n ${plan.n}`);
  const values = puzzle.cells.map((c) => c.n);
  if (values.length !== plan.n) return [...problems, `${at}: ${values.length} cells, not ${plan.n}`];
  if (!values.every((v) => Number.isSafeInteger(v) && v >= 1) || new Set(values).size !== values.length) {
    problems.push(`${at}: cells ${values.join(', ')} are not distinct positive integers`);
  }
  const triples = validTriples(values);
  if (triples.length !== 1) return [...problems, `${at}: ${triples.length} valid triples, not exactly 1`];
  const { a, b, c } = puzzle.roles;
  const roles = [a, b, c].sort((x, y) => x - y);
  if (roles.join() !== triples[0]!.join()) problems.push(`${at}: roles ${a}, ${b}, ${c} are not the valid triple ${triples[0]!.join(', ')}`);
  if (puzzle.answerIndex !== c) problems.push(`${at}: answerIndex ${puzzle.answerIndex} is not roles.c ${c}`);
  const [va, vb, vc] = [values[a]!, values[b]!, values[c]!];
  if (plan.operator === 'add' ? va + vb !== vc : va - vb !== vc) problems.push(`${at}: the triple does not read a ${plan.operator === 'add' ? '+' : '−'} b = c`);
  if (node.contract !== undefined && vc !== node.contract) problems.push(`${at}: answer ${vc} is not the contract ${node.contract}`);
  return problems;
}

/**
 * Every way `plan` breaks the round rules, as messages naming the node; empty when
 * it is consistent:
 *
 * - n + 1 (Classic) or n² + n + 1 (Tower) nodes, each id of the round once, top-down;
 * - every upper-tier node carries a puzzle with exactly one valid triple, roles and
 *   answerIndex naming it; every node below the top carries a contract, and an
 *   upper-tier node's answer is its contract;
 * - each child's contract is its parent's cell (cell j of (k, i) is child (k − 1, i·n + j));
 * - every leaf carries only a contract, which realises in band 1 from the leaf's own
 *   stream with that answer (`tuning` must be the plan's);
 * - a fixed top cell is where the plan says.
 */
export function roundPlanProblems(plan: RoundPlan, tuning: TuningConfig): string[] {
  const tiers = typeof plan.type === 'string' && Object.hasOwn(ROUND_TYPES, plan.type) ? ROUND_TYPES[plan.type].tiers : undefined;
  if (tiers === undefined || plan.tiers !== tiers) return [`plan type ${String(plan.type)} with ${String(plan.tiers)} tiers is not a known round type`];
  const { n } = plan;
  const problems: string[] = [];
  const expected = nodeCount(tiers, n);
  if (plan.nodes.length !== expected) problems.push(`${plan.nodes.length} nodes, not ${expected}`);
  const byId = new Map<string, RoundPlanNode>();
  plan.nodes.forEach((node, i) => {
    const { tier, index } = node.nodeId;
    if (tier < 1 || tier > tiers || index < 0 || index >= tierWidth(tiers, tier, n)) problems.push(`node ${label(node.nodeId)} is not in the round`);
    const key = `${tier}/${index}`;
    if (byId.has(key)) problems.push(`node ${label(node.nodeId)} appears twice`);
    byId.set(key, node);
    const previous = plan.nodes[i - 1];
    if (previous !== undefined && compareTopDown(previous.nodeId, node.nodeId) >= 0) problems.push(`node ${label(node.nodeId)} is out of top-down order`);
  });

  for (const node of plan.nodes) {
    const { nodeId } = node;
    const at = `node ${label(nodeId)}`;
    if (nodeId.tier === tiers) {
      if (node.contract !== undefined) problems.push(`${at}: the top carries a contract`);
    } else {
      if (node.contract === undefined) {
        problems.push(`${at}: no contract`);
        continue;
      }
      const { parent, cell } = parentOf(nodeId, n);
      const parentPuzzle = byId.get(`${parent.tier}/${parent.index}`)?.puzzle;
      const cellValue = parentPuzzle?.cells[cell]?.n;
      if (cellValue !== node.contract) problems.push(`${at}: contract ${node.contract} is not cell ${cell} of ${label(parent)} (${String(cellValue)})`);
    }
    if (nodeId.tier > 1) {
      if (node.puzzle === undefined) problems.push(`${at}: an upper-tier node without a puzzle`);
      else problems.push(...puzzleProblems(plan, node, node.puzzle));
      continue;
    }
    if (node.puzzle !== undefined) problems.push(`${at}: a leaf carries a puzzle (leaves are realised lazily)`);
    if (node.contract === undefined) continue;
    const spec = specFor(tuning, { n, operator: plan.operator, band: LEAF_CHECK_BAND, contract: node.contract });
    const leaf = spec.ok ? realise(plan.roundSeed, nodeId, spec.value, plan.versions) : spec;
    if (!leaf.ok) problems.push(`${at}: contract ${node.contract} does not realise in band ${LEAF_CHECK_BAND}: ${leaf.error.code}`);
    else if (leaf.value.cells[leaf.value.answerIndex]?.n !== node.contract) problems.push(`${at}: band-${LEAF_CHECK_BAND} answer is not ${node.contract}`);
  }

  if (plan.fixedTopCell !== undefined) {
    const top = byId.get(`${tiers}/0`)?.puzzle;
    const { childIndex, value } = plan.fixedTopCell;
    if (top?.cells[childIndex]?.n !== value) problems.push(`top cell ${childIndex} is not the fixed value ${value}`);
  }
  return problems;
}

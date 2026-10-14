// Nightly uniqueness run (FR-1, AD-19, epic-puzzle-generator Done-when 1), run by
// `pnpm nightly:check` with NIGHTLY_N (3..9, required in CI; default 3) and
// NIGHTLY_COUNT (puzzles per operator; default 100000). Every puzzle and sampled
// round is judged by tools/nightly/independent-check.mjs, which shares no code
// with the generator.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { deriveSeed, parseTuning, planRound, realiseRoundNode, specFor, realise, versionsFor } from '../../packages/core/src/index.ts';
import { TUNING_DIR } from '../tuning-content.mjs';
import { puzzleProblems, roundProblems } from './independent-check.mjs';

const N = Number(process.env.NIGHTLY_N ?? 3);
const COUNT = Number(process.env.NIGHTLY_COUNT ?? 100_000);
const ROUNDS = Number(process.env.NIGHTLY_ROUNDS ?? 200);
const ROOT_SEED = 20261013;

it(`n=${N}: ${COUNT} puzzles per operator and ${ROUNDS} Classic + ${ROUNDS} Tower rounds pass the independent check`, () => {
  expect(Number.isInteger(N) && N >= 3 && N <= 9, `NIGHTLY_N must be 3..9, got ${process.env.NIGHTLY_N}`).toBe(true);
  expect(Number.isInteger(COUNT) && COUNT >= 1, `NIGHTLY_COUNT must be a positive integer, got ${process.env.NIGHTLY_COUNT}`).toBe(true);
  expect(Number.isInteger(ROUNDS) && ROUNDS >= 1, `NIGHTLY_ROUNDS must be a positive integer, got ${process.env.NIGHTLY_ROUNDS}`).toBe(true);
  const parsed = parseTuning(JSON.parse(readFileSync(join(TUNING_DIR, '1.json'), 'utf8')));
  if (!parsed.ok) throw new Error(parsed.error.message);
  const tuning = parsed.value;
  const versions = versionsFor(tuning);
  const bands = tuning.generation.bands.map((b) => b.band);
  const failures: string[] = [];
  const counts: string[] = [];

  for (const operator of tuning.generation.operators) {
    let realised = 0;
    let unrealisable = 0;
    const served = new Map<number, number>(bands.map((b) => [b, 0]));
    for (let i = 0; i < COUNT && failures.length < 20; i += 1) {
      const band = bands[i % bands.length]!;
      const spec = specFor(tuning, { n: N, operator, band });
      if (!spec.ok) throw new Error(spec.error.message);
      const r = realise(deriveSeed(ROOT_SEED, i), { tier: 1, index: i % 997 }, spec.value, versions);
      if (!r.ok) {
        unrealisable += 1;
        failures.push(`${operator} #${i} band ${band}: ${r.error.code} ${r.error.message}`);
        continue;
      }
      realised += 1;
      const p = r.value;
      served.set(p.servedBand, (served.get(p.servedBand) ?? 0) + 1);
      for (const problem of puzzleProblems({ values: p.cells.map((c) => c.n), operator, answerIndex: p.answerIndex })) failures.push(`${operator} #${i}: ${problem}`);
    }

    let rounds = 0;
    for (const type of ['classic', 'tower'] as const) {
      for (let o = 0; o < ROUNDS && failures.length < 20; o += 1) {
        const plan = planRound({ type, n: N, operator }, tuning, deriveSeed(ROOT_SEED + 1, o), versions);
        if (!plan.ok) {
          failures.push(`${type} ${operator} round ${o}: ${plan.error.code} ${plan.error.message}`);
          continue;
        }
        rounds += 1;
        const nodes = plan.value.nodes.map((node) => ({
          tier: node.nodeId.tier,
          index: node.nodeId.index,
          ...(node.contract === undefined ? {} : { contract: node.contract }),
          ...(node.puzzle ? { values: node.puzzle.cells.map((c) => c.n), answerIndex: node.puzzle.answerIndex } : {}),
        }));
        const leafPuzzle = (index: number) => {
          const leaf = realiseRoundNode(plan.value, { tier: 1, index }, 1, tuning);
          return leaf.ok ? { values: leaf.value.cells.map((c) => c.n), answerIndex: leaf.value.answerIndex } : undefined;
        };
        for (const problem of roundProblems({ n: N, operator, tiers: plan.value.tiers, nodes, leafPuzzle })) failures.push(`${type} ${operator} round ${o}: ${problem}`);
      }
    }
    const spread = [...served].map(([b, c]) => `band ${b}: ${c}`).join(', ');
    counts.push(`${operator}: ${realised} puzzles checked (${unrealisable} unrealisable; served ${spread}), ${rounds} rounds checked`);
    if (failures.length < 20) {
      if (realised + unrealisable !== COUNT) failures.push(`${operator}: ${realised + unrealisable} puzzles attempted, expected ${COUNT}`);
      if (rounds !== 2 * ROUNDS) failures.push(`${operator}: ${rounds} rounds checked, expected ${2 * ROUNDS}`);
      for (const [b, c] of served) if (c === 0) failures.push(`${operator}: band ${b} served no puzzles (every request fell back)`);
    }
  }

  process.stdout.write(`n=${N}\n${counts.join('\n')}\n${failures.length ? `FAILURES (first ${failures.length}):\n${failures.join('\n')}\n` : 'no failures\n'}`);
  expect(failures, failures.join('\n')).toEqual([]);
});

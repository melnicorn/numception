import { displayValue, type NodeId, parseTuning, realise, versionsFor } from '@numception/core';

/** The dev panel's demo seed: a fixed constant, so every reload shows the same puzzle. */
export const DEMO_SEED = 20261011;
/** The demo puzzle's node: the first leaf. */
export const DEMO_NODE_ID: NodeId = { tier: 1, index: 0 };

/** One cell of the demo puzzle, ready to show. */
export type DemoPuzzleCell = { readonly text: string; readonly isAnswer: boolean };

/** The demo puzzle as plain, view-ready data (adapters format nothing themselves, AD-5). */
export type DemoPuzzleView = {
  readonly seed: number;
  readonly nodeId: { readonly tier: number; readonly index: number };
  readonly n: number;
  readonly operator: string;
  readonly operatorSymbol: string;
  readonly maxValue: number;
  /** In placement order. */
  readonly cells: readonly DemoPuzzleCell[];
  readonly answerIndex: number;
  readonly versions: {
    readonly generatorVersion: number;
    readonly difficultyModelVersion: number;
    readonly tuningVersion: number;
  };
};

/** The demo puzzle, or the domain error that stopped it. */
export type DemoPuzzleResult =
  | { readonly ok: true; readonly view: DemoPuzzleView }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } };

const OPERATOR_SYMBOLS = { add: '+', sub: '−' } as const;

/**
 * Validates `tuningJson` (passed in by the composition root, AD-7) and realises the
 * demo n = 3 puzzle at `DEMO_NODE_ID` with band 1's `maxValue` and `add` when the
 * tuning enables it, else its first operator. Until entry 4 only `add` realises: a
 * tuning enabling `sub` alone gets realise's `invalid-spec` error back.
 */
export function demoPuzzle(tuningJson: unknown, seed: number = DEMO_SEED): DemoPuzzleResult {
  const tuning = parseTuning(tuningJson);
  if (!tuning.ok) return { ok: false, error: { code: tuning.error.code, message: tuning.error.message } };

  const config = tuning.value;
  const band1 = config.generation.bands[0];
  // Unreachable for a parsed config: the schema requires band 1.
  if (band1 === undefined) return { ok: false, error: { code: 'invalid-tuning', message: 'Invalid TuningConfig: generation.bands: no band 1' } };
  // add whenever it's enabled (the only operator realised until entry 4), else the first.
  const operators = config.generation.operators;
  const operator = operators.includes('add') ? 'add' : (operators[0] ?? 'add');
  const spec = { n: 3, operator, maxValue: band1.maxValue } as const;
  const puzzle = realise(seed, DEMO_NODE_ID, spec, versionsFor(config));
  if (!puzzle.ok) return { ok: false, error: { code: puzzle.error.code, message: puzzle.error.message } };

  const p = puzzle.value;
  return {
    ok: true,
    view: {
      seed: p.seed,
      nodeId: p.nodeId,
      n: p.spec.n,
      operator: p.spec.operator,
      operatorSymbol: OPERATOR_SYMBOLS[p.spec.operator],
      maxValue: p.spec.maxValue,
      cells: p.cells.map((value, i) => ({ text: displayValue(value), isAnswer: i === p.answerIndex })),
      answerIndex: p.answerIndex,
      versions: p.versions,
    },
  };
}

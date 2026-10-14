import {
  bucketOf,
  deriveSeed,
  displayValue,
  type NodeId,
  type Operator,
  parseTuning,
  planRound,
  rational,
  realiseRoundNode,
  type RoundTypeName,
  versionsFor,
} from '@numception/core';

/** What the round inspector plans. `seed` may be the raw text of a seed field. */
export type InspectRoundRequest = {
  readonly tuningVersion: number;
  readonly type: RoundTypeName;
  readonly n: number;
  readonly operator: Operator;
  readonly seed: number | string;
  /** The band leaves are realised in (default 1). */
  readonly leafBand?: number;
};

/** One cell of an inspected puzzle, in placement order. */
export type InspectedCell = { readonly text: string; readonly isAnswer: boolean };

/** One puzzle of an inspected round, ready to show. */
export type InspectedNode = {
  /** `t<tier>.<index>`. */
  readonly label: string;
  readonly tier: number;
  readonly index: number;
  /** The parent's cell value this puzzle must answer (absent on the top). */
  readonly contract?: string;
  readonly cells: readonly InspectedCell[];
  readonly answerText: string;
  readonly servedBand: number;
  /** True when a leaf fell back below the requested band. */
  readonly clamped: boolean;
  readonly bucketId: string;
};

/** One tier of an inspected round. */
export type InspectedTier = { readonly tier: number; readonly nodes: readonly InspectedNode[] };

/** A planned round as plain, view-ready data (adapters format nothing themselves, AD-5). */
export type RoundInspectorView = {
  readonly tuningVersion: number;
  readonly type: RoundTypeName;
  readonly n: number;
  readonly operator: Operator;
  readonly operatorSymbol: string;
  /** The root seed asked for. */
  readonly seed: number;
  /** `deriveSeed(seed, 0)`: the seed every node stream of the round derives from. */
  readonly roundSeed: number;
  readonly leafBand: number;
  readonly puzzleCount: number;
  readonly versions: {
    readonly generatorVersion: number;
    readonly difficultyModelVersion: number;
    readonly tuningVersion: number;
  };
  /** Top first (tier 3 → 1 for Tower, 2 → 1 for Classic). */
  readonly tiers: readonly InspectedTier[];
};

/** An inspected round, or the error that stopped it. Never thrown. */
export type InspectRoundResult =
  | { readonly ok: true; readonly view: RoundInspectorView }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } };

const OPERATOR_SYMBOLS: Record<Operator, string> = { add: '+', sub: '−' };
const UINT32_MAX = 0xffffffff;

function fail(code: string, message: string): InspectRoundResult {
  return { ok: false, error: { code, message } };
}

/** A uint32 seed from a number or its decimal text, else undefined. */
function parseSeed(seed: unknown): number | undefined {
  let value: number;
  if (typeof seed === 'number') value = seed;
  else if (typeof seed === 'string' && /^\s*\d+\s*$/.test(seed)) value = Number(seed.trim());
  else return undefined;
  return Number.isInteger(value) && value >= 0 && value <= UINT32_MAX ? value : undefined;
}

/**
 * Plans the round the dev panel's round inspector asks for and realises every node:
 *
 * - validates `tunings[tuningVersion]` (passed in by the composition root, AD-7) and
 *   checks its `tuningVersion` matches the key;
 * - the round seed is `deriveSeed(seed, 0)`: the inspected round is round ordinal 0
 *   of a run started from `seed`, as the play loop will derive it;
 * - plans with core `planRound`, then realises every node with `realiseRoundNode`
 *   (upper tiers return their planned puzzle; leaves are realised now in `leafBand`).
 *
 * Every failure is returned as an error, never thrown.
 */
export function inspectRound(tunings: Readonly<Record<string, unknown>>, request: InspectRoundRequest): InspectRoundResult {
  try {
    return inspect(tunings, request);
  } catch (e) {
    // Core never throws on game input; this guards the adapter against the unexpected.
    return fail('unexpected', e instanceof Error ? e.message : 'unexpected error');
  }
}

function inspect(tunings: Readonly<Record<string, unknown>>, request: InspectRoundRequest): InspectRoundResult {
  const { tuningVersion, type, n, operator } = request;
  const key = String(tuningVersion);
  if (typeof tunings !== 'object' || tunings === null || !Object.hasOwn(tunings, key)) {
    return fail('unknown-tuning', `no bundled tuning has version ${key}`);
  }
  const tuning = parseTuning(tunings[key]);
  if (!tuning.ok) return fail(tuning.error.code, tuning.error.message);
  const config = tuning.value;
  if (config.tuningVersion !== tuningVersion) {
    return fail('unknown-tuning', `tuning file ${key} declares tuningVersion ${config.tuningVersion}`);
  }

  const seed = parseSeed(request.seed);
  if (seed === undefined) return fail('invalid-seed', `seed must be an integer in 0..${UINT32_MAX}, got ${JSON.stringify(String(request.seed))}`);
  const leafBand = request.leafBand ?? 1;

  const roundSeed = deriveSeed(seed, 0);
  const versions = versionsFor(config);
  const plan = planRound({ type, n, operator }, config, roundSeed, versions);
  if (!plan.ok) return fail(plan.error.code, plan.error.message);

  const byTier = new Map<number, InspectedNode[]>();
  for (const node of plan.value.nodes) {
    const nodeId: NodeId = node.nodeId;
    const puzzle = realiseRoundNode(plan.value, nodeId, leafBand, config);
    if (!puzzle.ok) return fail(puzzle.error.code, puzzle.error.message);
    const p = puzzle.value;
    const answer = p.cells[p.answerIndex];
    const inspected: InspectedNode = {
      label: `t${nodeId.tier}.${nodeId.index}`,
      tier: nodeId.tier,
      index: nodeId.index,
      ...(node.contract === undefined ? {} : { contract: displayValue(rational(node.contract)) }),
      cells: p.cells.map((value, i) => ({ text: displayValue(value), isAnswer: i === p.answerIndex })),
      answerText: answer === undefined ? '' : displayValue(answer),
      servedBand: p.servedBand,
      clamped: p.clamp !== undefined,
      bucketId: bucketOf(p).bucketId,
    };
    const list = byTier.get(nodeId.tier) ?? [];
    list.push(inspected);
    byTier.set(nodeId.tier, list);
  }
  const tiers = [...byTier.entries()]
    .sort(([a], [b]) => b - a)
    .map(([tier, nodes]) => ({ tier, nodes: nodes.sort((x, y) => x.index - y.index) }));

  return {
    ok: true,
    view: {
      tuningVersion,
      type: plan.value.type,
      n: plan.value.n,
      operator: plan.value.operator,
      operatorSymbol: OPERATOR_SYMBOLS[plan.value.operator],
      seed,
      roundSeed,
      leafBand,
      puzzleCount: plan.value.nodes.length,
      versions: plan.value.versions,
      tiers,
    },
  };
}

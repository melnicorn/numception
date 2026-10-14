// Builds the generator's integer-only PuzzleSpec from tuning. Lives outside
// core/generator because it quantises a float tuning weight (nearMissShare), and
// the purity check bans `Math.*` there (AD-3).
import type { Operator } from '../generator/operator';
import type { PuzzleBand, PuzzleSpec } from '../generator/puzzle-spec';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import type { TuningBand, TuningConfig } from '../tuning/tuning-config';

/**
 * What a node asks for: n cells, an operator, a band number, and optionally the
 * answer value it must produce (absent for an unconstrained node).
 */
export type SpecRequest = {
  readonly n: number;
  readonly operator: Operator;
  readonly band: number;
  readonly contract?: number;
};

/**
 * The number of near-miss distractors for `n` cells: `nearMissShare × (n − 3)`
 * rounded half up (`Math.round`; e.g. 0.5 × 3 = 1.5 → 2, 0.5 × 1 = 0.5 → 1),
 * kept within 0..n − 3.
 */
export function nearMissCountFor(nearMissShare: number, n: number): number {
  const slots = n - 3;
  const count = Math.round(nearMissShare * slots);
  return Math.min(slots, Math.max(0, count));
}

/**
 * Band `b` resolved for puzzle size `n`: the generator's ordinary band, from the
 * range covering `n`. Undefined only when no range covers `n`, which a validated
 * tuning rules out for every n in its `n.min..n.max`.
 */
function bandAt(b: TuningBand, n: number): PuzzleBand | undefined {
  const r = b.ranges.find((range) => range.nMin <= n && n <= range.nMax);
  return r === undefined ? undefined : { band: b.band, minValue: r.minValue, maxValue: r.maxValue, maxCarries: r.maxCarries };
}

function invalid(message: string): { readonly ok: false; readonly error: DomainError } {
  return err({ code: 'invalid-spec', message });
}

/**
 * The PuzzleSpec for `request` under a validated `tuning` (AD-7): the requested
 * band, every lower band as a fallback (nearest first), each resolved to its range
 * for the request's n (so the generator sees ordinary bands), the tuning's
 * near-miss delta and retry bound, and the quantised near-miss count
 * (`nearMissCountFor`).
 *
 * An `invalid-spec` error when n is outside the tuning's n range, the operator
 * isn't enabled, the band doesn't exist, or the contract isn't a safe integer.
 * Whether a contract is reachable is `realise`'s call (`unrealisable`).
 */
export function specFor(tuning: TuningConfig, request: SpecRequest): Result<PuzzleSpec, DomainError> {
  const g = tuning.generation;
  if (typeof request !== 'object' || request === null) return invalid('request must be an object');
  const { n, operator, contract } = request;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < g.n.min || n > g.n.max) {
    return invalid(`n must be an integer in ${g.n.min}..${g.n.max} (tuning ${tuning.tuningVersion}), got ${String(n)}`);
  }
  if (!(g.operators as readonly unknown[]).includes(operator)) {
    return invalid(`operator must be one of ${g.operators.join(', ')} (tuning ${tuning.tuningVersion}), got ${String(operator)}`);
  }
  const requested = g.bands.find((b) => b.band === request.band);
  if (requested === undefined) {
    return invalid(`band must be one of 1..${g.bands.length} (tuning ${tuning.tuningVersion}), got ${String(request.band)}`);
  }
  if (contract !== undefined && !Number.isSafeInteger(contract)) {
    return invalid(`contract must be absent or a safe integer, got ${String(contract)}`);
  }
  const resolved: PuzzleBand[] = [];
  for (const b of g.bands.filter((x) => x.band <= requested.band).sort((x, y) => y.band - x.band)) {
    const at = bandAt(b, n);
    if (at === undefined) return invalid(`band ${b.band} has no range for n ${n} (tuning ${tuning.tuningVersion})`);
    resolved.push(at);
  }
  const [band, ...fallbackBands] = resolved as [PuzzleBand, ...PuzzleBand[]];
  return ok({
    n,
    operator,
    band,
    fallbackBands,
    ...(contract === undefined ? {} : { contract }),
    nearMissCount: nearMissCountFor(g.distractors.nearMissShare, n),
    nearMissDelta: g.distractors.nearMissDelta,
    maxAttempts: g.retries.maxAttempts,
  });
}

import { OPERATORS } from '../generator/operator';
import type { PuzzleVersions } from '../generator/puzzle-versions';
import type { DomainError } from '../result/domain-error';
import { MAX_N, MIN_N } from '../tuning/generation-limits';
import type { TuningConfig } from '../tuning/tuning-config';
import type { FixedTopCell, PlanRequest, RoundTypeName } from './round-plan';

const UINT32_MAX = 0xffffffff;

/** A plan request whose fields have been checked (band defaulted). */
export type CheckedRequest = {
  readonly n: number;
  readonly operator: PlanRequest['operator'];
  readonly startBand: number;
  readonly fixedTopCell?: FixedTopCell;
};

function isInt(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x);
}

/** Primitives as themselves, anything else by type; never touches getters or toString. */
function show(x: unknown): string {
  if (typeof x === 'string') return JSON.stringify(x);
  if (typeof x === 'number' || typeof x === 'boolean' || x === undefined) return String(x);
  return x === null ? 'null' : typeof x;
}

function invalid(message: string): DomainError {
  return { code: 'invalid-request', message };
}

/**
 * Checks a plan request for round type `type` and its seed and versions, or returns
 * the error. Ranges the tuning decides (n range, enabled operators, existing bands)
 * are left to `specFor`, which reports them as `invalid-spec`; the generator version
 * is left to `realise` (`unsupported-version`).
 */
export function checkPlanRequest(
  type: RoundTypeName,
  request: PlanRequest,
  tuning: TuningConfig,
  roundSeed: number,
  versions: PuzzleVersions,
): CheckedRequest | DomainError {
  if (typeof request !== 'object' || request === null) return invalid(`request must be an object, got ${show(request)}`);
  if (request.type !== type) return invalid(`request.type must be ${JSON.stringify(type)} for this round type, got ${show(request.type)}`);
  const { n, operator, band, fixedTopCell } = request;
  if (!isInt(n) || n < MIN_N || n > MAX_N) return invalid(`request.n must be an integer in ${MIN_N}..${MAX_N}, got ${show(n)}`);
  if (typeof operator !== 'string' || !(OPERATORS as readonly string[]).includes(operator)) {
    return invalid(`request.operator must be one of ${OPERATORS.join(', ')}, got ${show(operator)}`);
  }
  if (band !== undefined && (!isInt(band) || band < 1)) return invalid(`request.band must be absent or a positive integer, got ${show(band)}`);
  if (fixedTopCell !== undefined) {
    if (typeof fixedTopCell !== 'object' || fixedTopCell === null) {
      return invalid(`request.fixedTopCell must be absent or an object, got ${show(fixedTopCell)}`);
    }
    const { childIndex, value } = fixedTopCell;
    if (!isInt(childIndex) || childIndex < 0 || childIndex >= n) {
      return invalid(`request.fixedTopCell.childIndex must be an integer in 0..${n - 1}, got ${show(childIndex)}`);
    }
    if (!Number.isSafeInteger(value) || value < 1) {
      return invalid(`request.fixedTopCell.value must be a positive safe integer, got ${show(value)}`);
    }
  }
  if (!isInt(roundSeed) || roundSeed < 0 || roundSeed > UINT32_MAX) {
    return { code: 'invalid-seed', message: `roundSeed must be an integer in 0..${UINT32_MAX}, got ${show(roundSeed)}` };
  }
  if (typeof versions !== 'object' || versions === null) return invalid(`versions must be an object, got ${show(versions)}`);
  if (versions.tuningVersion !== tuning.tuningVersion) {
    return invalid(`versions.tuningVersion ${show(versions.tuningVersion)} must be the tuning's ${tuning.tuningVersion}`);
  }
  return {
    n,
    operator,
    startBand: band ?? 1,
    ...(fixedTopCell === undefined ? {} : { fixedTopCell: { childIndex: fixedTopCell.childIndex, value: fixedTopCell.value } }),
  };
}

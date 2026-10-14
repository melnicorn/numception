import { OPERATORS, type Operator } from '../generator/operator';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import type { BucketFeatures } from './bucket-features';

const PATTERN = /^dm([1-9]\d*)\|([a-z]+)\|d([1-9]\d*)\|c(0|[1-9]\d*)\|n([1-9]\d*)\|nm(0|[1-9]\d*)$/;

/**
 * Parses a canonical bucketId back to its features. Exact inverse of `formatBucketId`:
 * no leading zeros, known operators only, every number a safe integer. Never throws.
 */
export function parseBucketId(id: string): Result<BucketFeatures, DomainError> {
  const m = typeof id === 'string' ? PATTERN.exec(id) : null;
  const bad = err<DomainError>({ code: 'invalid-bucket-id', message: `not a canonical bucketId: ${typeof id === 'string' ? JSON.stringify(id) : typeof id}` });
  if (!m) return bad;
  const operator = m[2] as Operator;
  if (!(OPERATORS as readonly string[]).includes(operator)) return bad;
  const nums = [m[1], m[3], m[4], m[5], m[6]].map(Number);
  if (nums.some((x) => !Number.isSafeInteger(x))) return bad;
  const [difficultyModelVersion, digits, carries, n, nearMisses] = nums as [number, number, number, number, number];
  return ok({ difficultyModelVersion, operator, digits, carries, n, nearMisses });
}

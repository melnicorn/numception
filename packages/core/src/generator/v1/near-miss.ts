import { absDiff } from './int-math';

/** `value` is within `delta` of `target` without equalling it. */
export function isNear(value: number, target: number, delta: number): boolean {
  const gap = absDiff(value, target);
  return gap >= 1 && gap <= delta;
}

/**
 * Whether `d` is a near-miss against `values`: within `delta` (but not equal) of
 * the sum or difference of some pair of `values`, skipping index `skip` (pass −1
 * to skip none). This is the epic's near-miss: a distractor close to some cell
 * pair's sum or difference.
 */
export function nearsSomePair(values: readonly number[], d: number, delta: number, skip: number): boolean {
  const n = values.length;
  for (let i = 0; i < n; i += 1) {
    if (i === skip) continue;
    const x = values[i] as number;
    for (let j = i + 1; j < n; j += 1) {
      if (j === skip) continue;
      const y = values[j] as number;
      if (isNear(d, x + y, delta) || isNear(d, absDiff(x, y), delta)) return true;
    }
  }
  return false;
}

/**
 * The near-miss distractors of a puzzle: each value at an index in `distractors`
 * that is within `delta` of the sum or difference of some pair of the other cells.
 */
export function countNearMisses(values: readonly number[], distractors: readonly number[], delta: number): number {
  let count = 0;
  for (const index of distractors) {
    if (nearsSomePair(values, values[index] as number, delta, index)) count += 1;
  }
  return count;
}

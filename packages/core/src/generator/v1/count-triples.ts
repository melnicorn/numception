/**
 * The valid triples among `values`: sets of three distinct cells where one equals
 * the sum of the other two. Brute force over all C(n, 3) cell sets (a − b = c and
 * a − c = b are the same set, counted once).
 */
export function countValidTriples(values: readonly number[]): number {
  let count = 0;
  const n = values.length;
  for (let i = 0; i < n; i += 1) {
    const x = values[i] as number;
    for (let j = i + 1; j < n; j += 1) {
      const y = values[j] as number;
      for (let k = j + 1; k < n; k += 1) {
        const z = values[k] as number;
        if (x + y === z || x + z === y || y + z === x) count += 1;
      }
    }
  }
  return count;
}

/**
 * Whether adding `d` to `values` would form a new valid triple: `d` is the sum or
 * the difference of some pair of `values`. (A repeated value is caught separately.)
 */
export function completesTriple(values: readonly number[], d: number): boolean {
  const n = values.length;
  for (let i = 0; i < n; i += 1) {
    const x = values[i] as number;
    for (let j = i + 1; j < n; j += 1) {
      const y = values[j] as number;
      if (d === x + y || d === x - y || d === y - x) return true;
    }
  }
  return false;
}

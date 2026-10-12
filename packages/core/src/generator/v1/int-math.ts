// Integer helpers for the generator. AD-3 bans `Math.*` here, and every value is a
// non-negative safe integer, so `%` and exact division do the work.

/** `⌊x / 2⌋` for a non-negative integer `x`. */
export function half(x: number): number {
  return (x - (x % 2)) / 2;
}

/** `|x − y|`. */
export function absDiff(x: number, y: number): number {
  return x > y ? x - y : y - x;
}

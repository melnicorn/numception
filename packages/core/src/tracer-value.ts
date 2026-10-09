// Exact rational sum, used by the workspace tracer (ticket 1) to prove a value
// computed in core reaches the page. The real `Rational` type belongs to the
// generator epic (AD-5).

type Fraction = readonly [numerator: number, denominator: number];

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Adds two fractions exactly and returns the reduced display string, `"n/d"` or `"n"`. */
export function tracerValue(a: Fraction = [1, 2], b: Fraction = [1, 3]): string {
  const numerator = a[0] * b[1] + b[0] * a[1];
  const denominator = a[1] * b[1];
  const divisor = gcd(numerator, denominator) || 1;
  const sign = denominator < 0 ? -1 : 1;
  const n = (sign * numerator) / divisor;
  const d = (sign * denominator) / divisor;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

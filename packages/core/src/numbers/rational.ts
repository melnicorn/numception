/**
 * A puzzle value (AD-5). POC shape: integers only, so the denominator is always 1
 * and the serialised form is `"n"`. The full normalised `Rational { n, d > 0 }`
 * with `"n/d"` serialisation arrives with fractions in v1, without changing this shape.
 */
export type Rational = { readonly n: number; readonly d: 1 };

/** The integer `n` as a `Rational`. Callers pass a safe integer. */
export function rational(n: number): Rational {
  return { n, d: 1 };
}

/** The AD-5 string form: `"n"` while `d` is 1. */
export function serialiseRational(r: Rational): string {
  return `${r.n}`;
}

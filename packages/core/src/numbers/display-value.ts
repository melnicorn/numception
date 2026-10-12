import type { Rational } from './rational';

/**
 * The text a cell shows for a value (AD-5: adapters never format values
 * themselves). POC: integers only, as plain ASCII digits with a leading `-` for
 * negatives and no grouping, independent of locale. The `{ glyphs, spoken }` form
 * and representations arrive with fractions and dot faces.
 */
export function displayValue(r: Rational): string {
  return `${r.n}`;
}

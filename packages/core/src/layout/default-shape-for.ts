import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import type { ShapeId } from './shape-id';

const DEFAULTS: Readonly<Record<number, ShapeId>> = { 3: '3A', 4: '4A', 5: '5B', 6: '6A', 7: '7A', 8: '8A', 9: '9B' };

/**
 * The POC shape pick for an n (DESIGN.md § Shapes). An n outside 3..9 (or not an
 * integer) is an `invalid-shape` error; never throws.
 */
export function defaultShapeFor(n: number): Result<ShapeId, DomainError> {
  const id = typeof n === 'number' && Number.isInteger(n) ? DEFAULTS[n] : undefined;
  if (id === undefined) {
    return err({ code: 'invalid-shape', message: `no shape for n = ${typeof n === 'number' ? n : typeof n}; n must be an integer in 3..9` });
  }
  return ok(id);
}

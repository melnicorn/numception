/**
 * Outcome of a core operation that can fail on game input. Core never throws on
 * bad input; it returns `{ ok: false, error }` instead (Consistency Conventions: Errors).
 */
export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

/** Wraps a success value. */
export function ok<T>(value: T): { readonly ok: true; readonly value: T } {
  return { ok: true, value };
}

/** Wraps a failure. */
export function err<E>(error: E): { readonly ok: false; readonly error: E } {
  return { ok: false, error };
}

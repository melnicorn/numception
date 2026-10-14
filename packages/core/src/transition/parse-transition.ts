import * as v from 'valibot';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { type Transition, TransitionSchema } from './transition';

/**
 * Validates transition JSON (a bundled `content/transitions/<id>.json`, passed in
 * by the composition root, AD-15). Never throws: bad input is an
 * `invalid-transition` error listing each issue as `path: message`.
 */
export function parseTransition(json: unknown): Result<Transition, DomainError> {
  const result = v.safeParse(TransitionSchema, json);
  if (result.success) return ok(Object.freeze(result.output));
  const issues = result.issues.map((issue) => {
    const path = v.getDotPath(issue);
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  return err({ code: 'invalid-transition', message: `Invalid transition: ${issues.join('; ')}`, issues });
}

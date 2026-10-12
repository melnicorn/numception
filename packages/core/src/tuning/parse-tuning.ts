import * as v from 'valibot';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { type TuningConfig, TuningConfigSchema } from './tuning-config';

/**
 * Validates tuning JSON (already parsed, e.g. a bundled `content/tuning/<n>.json`
 * passed in by the composition root, AD-7). Never throws: bad input is an
 * `invalid-tuning` error listing each issue as `path: message`.
 */
export function parseTuning(json: unknown): Result<TuningConfig, DomainError> {
  const result = v.safeParse(TuningConfigSchema, json);
  if (result.success) return ok(result.output);
  const issues = result.issues.map((issue) => {
    const path = v.getDotPath(issue);
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  return err({ code: 'invalid-tuning', message: `Invalid TuningConfig: ${issues.join('; ')}`, issues });
}

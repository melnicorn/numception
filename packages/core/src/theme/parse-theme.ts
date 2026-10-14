import * as v from 'valibot';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { type ThemeTokens, ThemeTokensSchema } from './theme-tokens';

/**
 * Validates theme JSON (already parsed, e.g. a bundled `content/themes/<id>.json`
 * passed in by the composition root, AD-15). Never throws: bad input is an
 * `invalid-theme` error listing each issue as `path: message`.
 */
export function parseTheme(json: unknown): Result<ThemeTokens, DomainError> {
  const result = v.safeParse(ThemeTokensSchema, json);
  if (result.success) return ok(Object.freeze(result.output));
  const issues = result.issues.map((issue) => {
    const path = v.getDotPath(issue);
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  return err({ code: 'invalid-theme', message: `Invalid theme: ${issues.join('; ')}`, issues });
}

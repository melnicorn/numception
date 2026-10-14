import type { DomainError } from '../result/domain-error';
import type { CommandContext } from './command-context';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isUint32(x: unknown): boolean {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 0xffffffff;
}

/** Why `ctx` is not a well-formed `CommandContext` (AD-22), or undefined when it is. */
export function checkContext(ctx: unknown): DomainError | undefined {
  const bad = (message: string): DomainError => ({ code: 'invalid-command', message: `ctx ${message}` });
  if (typeof ctx !== 'object' || ctx === null) return bad('must be an object');
  const c = ctx as Partial<CommandContext>;
  if (typeof c.nowMs !== 'number' || !Number.isFinite(c.nowMs)) return bad('.nowMs must be a finite number');
  if (typeof c.localDate !== 'string' || !ISO_DATE.test(c.localDate)) return bad('.localDate must be YYYY-MM-DD');
  if (typeof c.utcDate !== 'string' || !ISO_DATE.test(c.utcDate)) return bad('.utcDate must be YYYY-MM-DD');
  const e = c.entropy;
  if (typeof e !== 'object' || e === null) return bad('.entropy must be an object');
  if (!Array.isArray(e.ids) || e.ids.length < 2 || !e.ids.every((id) => typeof id === 'string' && id.length > 0)) {
    return bad('.entropy.ids must hold two non-empty ids');
  }
  if (!Array.isArray(e.seed32) || e.seed32.length < 2 || !e.seed32.every(isUint32)) {
    return bad('.entropy.seed32 must hold two uint32 values');
  }
  return undefined;
}

import type { TuningConfig } from '../tuning/tuning-config';
import type { AppState } from './app-state';
import { checkContext } from './check-context';
import type { Envelope } from './envelope';
import { reduceStartSession } from './reduce-start-session';
import { reduceTapCell } from './reduce-tap-cell';
import { reject } from './reject';
import type { StepResult } from './step-result';

/**
 * The one way state changes (AD-2): `step(state, { command, ctx }, tuning)`. Pure
 * and deterministic (AD-3): time and entropy come only from `ctx` (AD-22) and the
 * tuning is passed in (AD-7). Never throws on game input: a malformed envelope or
 * a command that cannot run returns `state` unchanged with a `CommandRejected`.
 */
export function step(state: AppState, envelope: Envelope, tuning: TuningConfig): StepResult {
  const command: unknown = typeof envelope === 'object' && envelope !== null ? envelope.command : undefined;
  const type = typeof command === 'object' && command !== null ? (command as { type?: unknown }).type : undefined;
  const name = typeof type === 'string' ? type : 'unknown';
  const bad = checkContext(envelope?.ctx);
  if (bad !== undefined) return reject(state, name, bad);
  const { ctx } = envelope;
  switch (type) {
    case 'StartSession':
      return reduceStartSession(state, ctx, tuning);
    case 'TapCell': {
      const tap = command as { nodeId?: unknown; cellIndex?: unknown };
      if (typeof tap.nodeId !== 'object' || tap.nodeId === null || typeof tap.cellIndex !== 'number') {
        return reject(state, name, { code: 'invalid-command', message: 'TapCell needs a nodeId and a numeric cellIndex' });
      }
      return reduceTapCell(state, envelope.command as Extract<Envelope['command'], { type: 'TapCell' }>, ctx, tuning);
    }
    default:
      return reject(state, name, { code: 'invalid-command', message: `unknown command ${name}` });
  }
}

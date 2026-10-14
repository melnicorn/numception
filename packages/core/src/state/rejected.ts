import type { DomainError } from '../result/domain-error';
import type { GameEvent } from './game-event';

/** The `CommandRejected` event for `command` failing with `error`. */
export function rejected(command: string, error: DomainError): GameEvent {
  return { type: 'CommandRejected', command, code: error.code, message: error.message };
}

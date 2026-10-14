import type { DomainError } from '../result/domain-error';
import type { AppState } from './app-state';
import type { StepResult } from './step-result';

/** `state` unchanged, with one `CommandRejected` saying why. */
export function reject(state: AppState, command: string, error: DomainError): StepResult {
  return { state, events: [{ type: 'CommandRejected', command, code: error.code, message: error.message }] };
}

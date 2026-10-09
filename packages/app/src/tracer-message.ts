import { tracerValue } from '@numception/core';

/** Passes the core tracer value through the shell unchanged (core -> app hop). */
export function tracerMessage(): string {
  return tracerValue();
}

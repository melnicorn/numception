import { tracerMessage } from '@numception/app';

/** Shows the tracer value that travelled core -> app -> ui. */
export function TracerBadge() {
  return (
    <p>
      Tracer: <output data-testid="tracer-value">{tracerMessage()}</output>
    </p>
  );
}

import { h, render } from 'preact';
import { TracerBadge } from './tracer-badge';

/** Renders the tracer badge into `el`, so callers never import Preact themselves. */
export function mountTracer(el: HTMLElement): void {
  render(h(TracerBadge, null), el);
}

// Composition root: wires packages together; never imports Preact directly (AD-1).
import { mountTracer } from '@numception/ui';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root element');
}
mountTracer(root);

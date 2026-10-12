// Composition root: wires packages together; never imports Preact directly (AD-1).
import { mountTracer } from '@numception/ui';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root element');
}
mountTracer(root);

// Dev panel: dev and playtest only. The constant is a literal `false` in prod, so
// the bundler drops this branch and emits no dev-panel chunk (AD-18).
if (__NUMCEPTION_DEV_PANEL__) {
  const host = document.createElement('div');
  document.body.append(host);
  void import('@numception/ui/dev-panel').then(({ mountDevPanel }) => mountDevPanel(host));
}

// The tuning fixtures (packages/core/test/fixtures/tuning/<name>.json), by name.
// Fixture tunings, never content/tuning: editing content/ must not trip the golden check.
// `import.meta.glob` is resolved by Vite, so this loads the same way in Vitest,
// the WebKit harness build and `pnpm golden:update`.
import type { GoldenTunings } from './golden-seeds';

const modules = import.meta.glob<unknown>('../fixtures/tuning/*.json', { eager: true, import: 'default' });

export const goldenTunings: GoldenTunings = Object.fromEntries(
  Object.entries(modules).map(([path, json]) => [path.slice(path.lastIndexOf('/') + 1, -'.json'.length), json]),
);

// The golden-seed fixtures (packages/core/test/fixtures/golden-seeds/generator-v<N>.json),
// by file name. See golden-tunings.ts for why this uses `import.meta.glob`.
const modules = import.meta.glob<unknown>('../fixtures/golden-seeds/generator-v*.json', { eager: true, import: 'default' });

export const goldenFixtures: { readonly [file: string]: unknown } = Object.fromEntries(
  Object.entries(modules).map(([path, json]) => [path.slice(path.lastIndexOf('/') + 1), json]),
);

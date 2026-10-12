// The slice of Vite's `import.meta.glob` these helpers use. Core doesn't depend on
// Vite, so its client types aren't available here; Vitest and Vite resolve the call.
interface ImportMeta {
  glob<T>(pattern: string, options: { readonly eager: true; readonly import: 'default' }): Record<string, T>;
}

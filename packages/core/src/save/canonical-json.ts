/**
 * `value` as canonical JSON: `JSON.stringify` with every object's keys sorted
 * (code-unit order) at every depth, and no whitespace. Properties whose value is
 * `undefined` are left out and array holes become `null`, as `JSON.stringify` does,
 * so two values that serialise to the same JSON give the same string.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value)) ?? 'null';
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value !== 'object' || value === null) return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) out[key] = sortKeys((value as Record<string, unknown>)[key]);
  return out;
}

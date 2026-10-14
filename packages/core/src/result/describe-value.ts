/**
 * A short description of an input value for an error message. Never throws: it
 * formats primitives only and names the type of anything else, so no getter,
 * `toString`, `toJSON`, bigint or cycle is ever touched.
 */
export function describeValue(x: unknown): string {
  switch (typeof x) {
    case 'number':
    case 'boolean':
      return `${x}`;
    case 'bigint':
      return `${x}n`;
    case 'string':
      return JSON.stringify(x);
    case 'undefined':
      return 'undefined';
    default:
      return x === null ? 'null' : typeof x;
  }
}

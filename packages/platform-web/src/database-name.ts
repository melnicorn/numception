/**
 * The IndexedDB database of a build flavour: `numception` plus the flavour's
 * appId (AD-18), so dev, playtest and prod builds served from one origin never
 * share saves.
 */
export function databaseName(appId: string): string {
  return `numception:${appId}`;
}

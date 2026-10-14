/** A ULID (Consistency Conventions: IDs), taken only from `ctx.entropy` (AD-22). */
export type Ulid = string;

/**
 * The time and entropy every command carries (AD-22). Core reads no clock and no
 * ambient randomness: ids and new `rootSeed`s come only from `entropy`, which the
 * shell refills on every dispatch. Puzzle seeds never come from here (AD-4).
 *
 * - `nowMs`: the shell's clock, integer ms.
 * - `localDate`, `utcDate`: ISO `YYYY-MM-DD`.
 * - `entropy.ids`: two fresh ULIDs; `entropy.seed32`: two fresh uint32s.
 */
export type CommandContext = {
  readonly nowMs: number;
  readonly localDate: string;
  readonly utcDate: string;
  readonly entropy: {
    readonly ids: readonly [Ulid, Ulid];
    readonly seed32: readonly [number, number];
  };
};

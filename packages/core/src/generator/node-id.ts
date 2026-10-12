/**
 * Address of a puzzle in a round (AD-4): bottom-anchored, tier 1 holds the leaves,
 * and the children of `(k, i)` are `(k−1, i·n … i·n+n−1)`. Ids never change once issued.
 * Both fields are integers: `tier >= 1`, `index >= 0`, each at most 2^32 − 1.
 */
export type NodeId = { readonly tier: number; readonly index: number };

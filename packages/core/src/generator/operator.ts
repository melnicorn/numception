/**
 * The operators a POC build's tuning may enable (FR-3 POC): + and −. × and ÷ are v1
 * and deliberately absent, so a tuning file naming them fails validation.
 */
export const OPERATORS = ['add', 'sub'] as const;

/** An operator a tuning config may enable, and `realise` generates. */
export type Operator = (typeof OPERATORS)[number];

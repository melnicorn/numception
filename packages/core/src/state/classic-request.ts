import type { PlanRequest } from '../rounds/round-plan';

/**
 * The round every personal round is for now: Classic, n = 3, `+` (epic Notes: level
 * progression is tabled; entry 2's `nextRoundRequest` replaces this).
 */
export const CLASSIC_REQUEST: PlanRequest = { type: 'classic', n: 3, operator: 'add' };

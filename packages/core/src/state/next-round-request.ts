import type { PlanRequest } from '../rounds/round-plan';
import type { GameState } from './game-state';

/** The stand-in round sequence, repeating: Classic +, Tower +, Classic −, Tower −. */
const SEQUENCE: readonly Pick<PlanRequest, 'type' | 'operator'>[] = [
  { type: 'classic', operator: 'add' },
  { type: 'tower', operator: 'add' },
  { type: 'classic', operator: 'sub' },
  { type: 'tower', operator: 'sub' },
];

/**
 * What round `game.roundOrdinal` is (epic Notes, 2026-10-14: level progression is
 * tabled; epic-adaptive-difficulty's selection and FR-47's level pin replace this):
 * n = 3, starting in band 1, cycling Classic +, Tower +, Classic −, Tower −
 * (ordinals 0, 1, 2, 3, then again from 4). Its seed is
 * `deriveSeed(rootSeed, roundOrdinal)` (AD-4).
 */
export function nextRoundRequest(game: Pick<GameState, 'roundOrdinal'>): PlanRequest {
  const { type, operator } = SEQUENCE[game.roundOrdinal % SEQUENCE.length] as (typeof SEQUENCE)[number];
  return { type, n: 3, operator, band: 1 };
}

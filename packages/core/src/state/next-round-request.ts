import type { PlanRequest } from '../rounds/round-plan';
import type { GameState } from './game-state';

/**
 * What round `game.roundOrdinal` is (epic Notes, 2026-10-14: level progression is
 * tabled; epic-adaptive-difficulty's selection and FR-47's level pin replace this):
 * n = 3, `+`, starting in band 1, alternating Classic (ordinals 0, 2, 4, …) and
 * Tower (1, 3, 5, …). Its seed is `deriveSeed(rootSeed, roundOrdinal)` (AD-4).
 */
export function nextRoundRequest(game: Pick<GameState, 'roundOrdinal'>): PlanRequest {
  return { type: game.roundOrdinal % 2 === 0 ? 'classic' : 'tower', n: 3, operator: 'add', band: 1 };
}

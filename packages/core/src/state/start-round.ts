import { versionsFor } from '../generator/versions-for';
import type { Presentation } from '../presentation/presentation';
import { deriveSeed } from '../random/derive-seed';
import type { DomainError } from '../result/domain-error';
import { err, type Result } from '../result/result';
import { pathFromTop } from '../rounds/path-from-top';
import { playOrder } from '../rounds/play-order';
import { planRound } from '../rounds/round-types';
import { selectPresentation } from '../presentation/select-presentation';
import type { ThemeCatalog } from '../theme/theme-catalog';
import type { TuningConfig } from '../tuning/tuning-config';
import type { GameState } from './game-state';
import { nextRoundRequest } from './next-round-request';
import type { Round } from './round';
import { serveNode } from './serve-node';

/**
 * Plans round `game.roundOrdinal` (`nextRoundRequest`; AD-4 seed
 * `deriveSeed(rootSeed, roundOrdinal)`), realises its first leaf and views it:
 * `viewPath` runs from the top to that leaf (AD-25). The round opens on
 * `presentation`; the leaf counts as shown from `shownAtMs` (null while a beat runs).
 * Its theme is chosen from `themes` (`selectPresentation`), never the same as
 * `previousThemeId`'s while the pool has another.
 */
export function startRound(
  roundId: string,
  game: GameState,
  tuning: TuningConfig,
  presentation: Presentation,
  shownAtMs: number | null,
  themes: ThemeCatalog,
  previousThemeId: string | null,
): Result<Round, DomainError> {
  const seed = deriveSeed(game.rootSeed, game.roundOrdinal);
  const { themeId } = selectPresentation({ mode: game.settings.mode, previousThemeId, roundSeed: seed }, tuning, themes);
  const plan = planRound(nextRoundRequest(game), tuning, seed, versionsFor(tuning));
  if (!plan.ok) return plan;
  const [first] = playOrder(plan.value.tiers, plan.value.n);
  if (first === undefined) return err({ code: 'invalid-request', message: 'plan has no leaves' });
  const round: Round = {
    roundId,
    type: plan.value.type,
    seed,
    mode: 'zen',
    tuningVersion: tuning.tuningVersion,
    plan: plan.value,
    puzzles: {},
    solved: [],
    viewPath: pathFromTop(first, plan.value.tiers, plan.value.n),
    presentation,
    shownAtMs,
    nextRoundId: null,
    previousTop: null,
    themeId,
    previousThemeId,
    softMiss: null,
    guideLine: false,
  };
  return serveNode(round, first, tuning);
}

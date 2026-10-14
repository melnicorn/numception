import type { Presentation } from '../presentation/presentation';
import type { DomainError } from '../result/domain-error';
import type { TuningConfig } from '../tuning/tuning-config';
import { idleAt } from './beat';
import { endBeat, type TimelineResult } from './end-beat';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { isPlayable } from './is-playable';
import { withRound } from './with-round';

/** A timeline run: the game and events, plus the error a beat end failed with (null when none did). */
export type TimelineRun = TimelineResult & { readonly error: DomainError | null };

/**
 * Runs `game`'s active round's timeline (AD-20): while a beat is running and
 * `endOf` gives it an end time, ends it there (`endBeat`) and goes on with the beat
 * that follows, so one call may cross several beats. Stops at idle, or at a beat
 * `endOf` leaves running (null).
 *
 * If a beat end fails (a leaf that cannot be realised, a round that cannot be
 * planned), the round is settled idle on what is in view at `game.clockMs`, without
 * the failed follow-on, and the error is returned for one `CommandRejected`: the
 * board unlocks and the scheduler stops instead of retrying every frame.
 */
export function runTimeline(
  game: GameState,
  tuning: TuningConfig,
  endOf: (presentation: Presentation) => number | null,
): TimelineRun {
  let current = game;
  const events: GameEvent[] = [];
  for (;;) {
    const roundId = current.rounds.activeRoundId;
    const round = roundId === null ? undefined : current.rounds.byId[roundId];
    if (round === undefined || round.presentation.kind === 'idle') break;
    const endAt = endOf(round.presentation);
    if (endAt === null) break;
    const ended = endBeat(current, round, endAt, tuning);
    if (!ended.ok) {
      const inView = round.viewPath[round.viewPath.length - 1];
      const shown = inView !== undefined && isPlayable(round, inView) ? current.clockMs : null;
      const settled = { ...round, presentation: idleAt(current.clockMs), shownAtMs: shown };
      return { game: withRound(current, settled), events, error: ended.error };
    }
    current = ended.value.game;
    events.push(...ended.value.events);
  }
  return { game: current, events, error: null };
}

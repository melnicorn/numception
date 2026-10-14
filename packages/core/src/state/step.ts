import { BUILTIN_THEMES, type ThemeCatalog } from '../theme/theme-catalog';
import type { TuningConfig } from '../tuning/tuning-config';
import type { TuningsByVersion } from '../tuning/tunings-by-version';
import type { AppState } from './app-state';
import { checkContext } from './check-context';
import type { Envelope } from './envelope';
import { gateInput } from './gate-input';
import { reduceEnterPuzzle } from './reduce-enter-puzzle';
import { reducePause } from './reduce-pause';
import { reduceResume } from './reduce-resume';
import { reduceSetOsPreferences } from './reduce-set-os-preferences';
import { reduceSetSetting } from './reduce-set-setting';
import { reduceStartSession } from './reduce-start-session';
import { reduceTapCell } from './reduce-tap-cell';
import { reduceTick } from './reduce-tick';
import { reduceZoomOut } from './reduce-zoom-out';
import { reject } from './reject';
import type { StepResult } from './step-result';

/**
 * The one way state changes (AD-2): `step(state, { command, ctx }, tuning, themes)`. Pure
 * and deterministic (AD-3): time and entropy come only from `ctx` (AD-22), play
 * time only from `Tick` (AD-17), and the tuning (AD-7) and the theme catalogue a
 * new round's theme is drawn from (AD-15; the built-in Kiln by default) are
 * passed in, with every bundled tuning by version (`tunings`), so a round keeps
 * realising its leaves under the tuning it is pinned to (AD-7). Never throws
 * on game input: a malformed envelope or a command that cannot run returns
 * `state` unchanged with a `CommandRejected`.
 *
 * While `pauseReasons` holds anything (AD-17), `Tick` is ignored and input goes
 * through `gateInput` (dropped, or the blur-clearing first tap).
 */
export function step(
  state: AppState,
  envelope: Envelope,
  tuning: TuningConfig,
  themes: ThemeCatalog = BUILTIN_THEMES,
  tunings: TuningsByVersion = {},
): StepResult {
  const command: unknown = typeof envelope === 'object' && envelope !== null ? envelope.command : undefined;
  const fields = typeof command === 'object' && command !== null ? (command as Record<string, unknown>) : {};
  const type = fields.type;
  const name = typeof type === 'string' ? type : 'unknown';
  const bad = checkContext(envelope?.ctx);
  if (bad !== undefined) return reject(state, name, bad);
  const { ctx } = envelope;
  switch (type) {
    case 'StartSession':
      return reduceStartSession(state, ctx, tuning, themes, tunings, fields.restore);
    case 'TapCell': {
      if (typeof fields.nodeId !== 'object' || fields.nodeId === null || typeof fields.cellIndex !== 'number') {
        return reject(state, name, { code: 'invalid-command', message: 'TapCell needs a nodeId and a numeric cellIndex' });
      }
      return gateInput(state, name) ?? reduceTapCell(state, envelope.command as Extract<Envelope['command'], { type: 'TapCell' }>, ctx, tuning);
    }
    case 'EnterPuzzle':
      return gateInput(state, name) ?? reduceEnterPuzzle(state, fields.nodeId, tuning, tunings);
    case 'ZoomOut':
      return gateInput(state, name) ?? reduceZoomOut(state);
    case 'Tick':
      return reduceTick(state, fields.elapsedMs, tuning, themes, tunings);
    case 'Pause':
      return reducePause(state, fields.reason, tuning, themes, tunings);
    case 'Resume':
      return reduceResume(state, fields.reason);
    case 'SetSetting':
      return reduceSetSetting(state, fields);
    case 'SetOsPreferences':
      return reduceSetOsPreferences(state, fields.reduceMotion);
    default:
      return reject(state, name, { code: 'invalid-command', message: `unknown command ${name}` });
  }
}

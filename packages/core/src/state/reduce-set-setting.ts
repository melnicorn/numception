import type { DomainError } from '../result/domain-error';
import { isMotionLevel } from '../settings/motion-level';
import type { SettingChange } from '../settings/setting-change';
import { MAX_PLAYLIST_LENGTH, THEME_SELECTIONS, type ThemeSelection } from '../settings/theme-selection';
import type { AppState } from './app-state';
import type { ProfileSettings } from './game-state';
import { reject } from './reject';
import type { StepResult } from './step-result';
import { withGame } from './with-game';

const COMMAND = 'SetSetting';

function invalid(message: string): DomainError {
  return { code: 'invalid-command', message };
}

/** `fields` as a valid setting change, or why not. */
function parseChange(fields: Readonly<Record<string, unknown>>): SettingChange | DomainError {
  const { key, value } = fields;
  switch (key) {
    case 'motion':
      return isMotionLevel(value) ? { key, value } : invalid('motion must be full, calm or minimal');
    case 'themeSelection':
      return typeof value === 'string' && (THEME_SELECTIONS as readonly string[]).includes(value)
        ? { key, value: value as ThemeSelection }
        : invalid('themeSelection must be randomize or playlist');
    case 'playlist': {
      if (!Array.isArray(value) || value.length > MAX_PLAYLIST_LENGTH || !value.every((id) => typeof id === 'string' && id !== '')) {
        return invalid(`playlist must be at most ${MAX_PLAYLIST_LENGTH} non-empty theme ids`);
      }
      if (new Set(value).size !== value.length) return invalid('playlist theme ids must be distinct');
      return { key, value: [...(value as string[])] };
    }
    case 'effects':
    case 'music':
    case 'haptics':
      return typeof value === 'boolean' ? { key, value } : invalid(`${key} must be a boolean`);
    default:
      return invalid(`unknown setting ${typeof key === 'string' ? key : String(key)}`);
  }
}

function same(settings: ProfileSettings, change: SettingChange): boolean {
  if (change.key === 'playlist') {
    const current = settings.playlist;
    return current.length === change.value.length && current.every((id, i) => id === change.value[i]);
  }
  return settings[change.key] === change.value;
}

/**
 * `SetSetting { key, value }` (AD-2, AD-21): sets one of the active profile's
 * settings and emits `SettingChanged`. Setting a value it already has changes
 * nothing and emits nothing. A malformed change, or no active profile, is rejected.
 * Not gated by pauses: the control surface opens over a paused board.
 */
export function reduceSetSetting(state: AppState, fields: Readonly<Record<string, unknown>>): StepResult {
  const game = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  if (game === undefined) return reject(state, COMMAND, invalid('no active profile'));
  const change = parseChange(fields);
  if ('code' in change) return reject(state, COMMAND, change);
  if (same(game.settings, change)) return { state, events: [] };
  const settings: ProfileSettings = { ...game.settings, [change.key]: change.value };
  return { state: withGame(state, { ...game, settings }), events: [{ type: 'SettingChanged', profileId: game.profileId, ...change }] };
}

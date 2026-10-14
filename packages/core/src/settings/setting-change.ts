import type { MotionLevel } from './motion-level';
import type { ThemeSelection } from './theme-selection';

/** One per-profile setting and its new value (AD-21), as `SetSetting` carries it and `SettingChanged` reports it. */
export type SettingChange =
  | { readonly key: 'motion'; readonly value: MotionLevel }
  | { readonly key: 'themeSelection'; readonly value: ThemeSelection }
  | { readonly key: 'playlist'; readonly value: readonly string[] }
  | { readonly key: 'effects' | 'music' | 'haptics'; readonly value: boolean };

/** Every key `SetSetting` takes. */
export type SettingKey = SettingChange['key'];

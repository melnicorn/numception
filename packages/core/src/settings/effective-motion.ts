import type { MotionLevel } from './motion-level';

/**
 * The Motion level play runs at (EXPERIENCE Accessibility Floor): the lower of the
 * player's setting and the OS. OS Reduce Motion on is `minimal`, the lowest; off,
 * the OS sets no limit, so the setting stands.
 */
export function effectiveMotion(setting: MotionLevel, reduceMotion: boolean): MotionLevel {
  return reduceMotion ? 'minimal' : setting;
}

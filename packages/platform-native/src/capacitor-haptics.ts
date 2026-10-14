import type { HapticsPort } from '@numception/app';
import { Haptics } from '@capacitor/haptics';
import { nativeHaptics } from './native-haptics';

/** The haptics port over the registered Capacitor Haptics plugin (native shells only). */
export function capacitorHaptics(): HapticsPort {
  return nativeHaptics(Haptics);
}

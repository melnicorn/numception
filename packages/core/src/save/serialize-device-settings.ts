import type { DeviceState } from '../state/app-state';
import type { DeviceSettingsDocument } from './device-settings';

/** `device` as its persisted document (AD-10): written after the active profile's snapshot. */
export function serializeDeviceSettings(device: DeviceState): DeviceSettingsDocument {
  return { kind: 'DeviceSettings', schemaVersion: 1, activeProfileId: device.activeProfileId };
}

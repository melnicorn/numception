/** The per-device document (AD-10, AD-21), persisted apart from the profile snapshots. */
export type DeviceSettingsDocument = {
  readonly kind: 'DeviceSettings';
  readonly schemaVersion: 1;
  readonly activeProfileId: string | null;
};

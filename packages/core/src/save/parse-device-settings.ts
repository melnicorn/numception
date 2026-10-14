import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import type { DeviceState } from '../state/app-state';

/**
 * Parses the persisted `DeviceSettings` JSON text, never throwing. A
 * `schemaVersion` above 1 is `save-too-new` (never overwritten); anything else
 * malformed is `invalid-save`.
 */
export function parseDeviceSettings(json: string): Result<DeviceState, DomainError> {
  const invalid = (message: string) => err<DomainError>({ code: 'invalid-save', message: `DeviceSettings ${message}` });
  let doc: unknown;
  try {
    doc = JSON.parse(json);
  } catch {
    return invalid('is not valid JSON');
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return invalid('must be an object');
  const d = doc as Record<string, unknown>;
  if (d.kind !== 'DeviceSettings') return invalid('kind must be DeviceSettings');
  if (typeof d.schemaVersion !== 'number' || !Number.isSafeInteger(d.schemaVersion) || d.schemaVersion < 1) {
    return invalid('schemaVersion must be a positive integer');
  }
  if (d.schemaVersion > 1) return err({ code: 'save-too-new', message: `DeviceSettings schemaVersion ${d.schemaVersion} is newer than 1` });
  const id = d.activeProfileId;
  if (id !== null && (typeof id !== 'string' || id === '')) return invalid('activeProfileId must be a non-empty string or null');
  return ok({ activeProfileId: id });
}

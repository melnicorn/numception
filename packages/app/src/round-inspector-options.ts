import { type Operator, parseTuning } from '@numception/core';

/** What the round inspector's controls may offer for one bundled tuning. */
export type TuningInspectorOptions =
  | {
      readonly tuningVersion: number;
      readonly ok: true;
      readonly nMin: number;
      readonly nMax: number;
      readonly operators: readonly { readonly operator: Operator; readonly symbol: string }[];
      readonly bands: readonly number[];
    }
  | { readonly tuningVersion: number; readonly ok: false; readonly error: { readonly code: string; readonly message: string } };

/** The inspector's options: every bundled tuning, lowest version first, and the default one. */
export type RoundInspectorOptions = {
  readonly tunings: readonly TuningInspectorOptions[];
  /** Version 1 when bundled, else the lowest; undefined when none is bundled. */
  readonly defaultTuningVersion: number | undefined;
};

const OPERATOR_SYMBOLS: Record<Operator, string> = { add: '+', sub: '−' };

/**
 * Reads the n range, operators and bands of every bundled tuning (keyed by
 * tuningVersion, as the composition root passes them, AD-7), so the inspector's
 * controls only offer what the tuning allows. Keys that are not a positive integer
 * are not tuning versions and are skipped; an invalid tuning is listed with its error.
 */
export function roundInspectorOptions(tunings: Readonly<Record<string, unknown>>): RoundInspectorOptions {
  const versions = Object.keys(tunings)
    .filter((k) => /^[1-9]\d*$/.test(k))
    .map(Number)
    .filter(Number.isSafeInteger)
    .sort((a, b) => a - b);
  const list = versions.map((tuningVersion): TuningInspectorOptions => {
    const parsed = parseTuning(tunings[String(tuningVersion)]);
    if (!parsed.ok) return { tuningVersion, ok: false, error: { code: parsed.error.code, message: parsed.error.message } };
    if (parsed.value.tuningVersion !== tuningVersion) {
      // inspectRound rejects such a file too, so the panel shows it as invalid.
      const message = `tuning file ${tuningVersion} declares tuningVersion ${parsed.value.tuningVersion}`;
      return { tuningVersion, ok: false, error: { code: 'unknown-tuning', message } };
    }
    const g = parsed.value.generation;
    return {
      tuningVersion,
      ok: true,
      nMin: g.n.min,
      nMax: g.n.max,
      operators: g.operators.map((operator) => ({ operator, symbol: OPERATOR_SYMBOLS[operator] })),
      bands: g.bands.map((b) => b.band),
    };
  });
  return { tunings: list, defaultTuningVersion: versions.includes(1) ? 1 : versions[0] };
}

import type { SettingsControls } from '@numception/app';
import { useState } from 'preact/hooks';

const rowStyle = { display: 'block', margin: '4px 0' };

/** The Minimal-motion transition: never in the rotation, so it cannot be forced, only previewed. */
const MINIMAL_ONLY = 'crossfade';

/**
 * Dev panel block for rating the transitions (ticket 6.5): "Round changes" forces
 * one transition for every round change from now (`SetTransitionOverride`; Random
 * is core's usual draw, and Minimal motion still crossfades), and each Preview
 * button closes the panel and replays the last round change, or the board into
 * another theme, as that transition, with its sound.
 */
export function TransitionBlock({
  settings,
  preview,
  onPreview,
}: {
  settings: SettingsControls;
  preview?: (transitionId: string) => boolean;
  onPreview?: () => void;
}) {
  const [forced, setForced] = useState(() => settings.transitionOverride());
  const [note, setNote] = useState('');
  const ids = settings.transitionIds;
  return (
    <section data-testid="dev-transitions" aria-labelledby="dev-transitions-heading" style={{ marginTop: '8px' }}>
      <h3 id="dev-transitions-heading" style={{ margin: 0, fontSize: '13px' }}>
        Transitions
      </h3>
      <label style={rowStyle}>
        Round changes{' '}
        <select
          value={forced ?? ''}
          onChange={(e) => {
            const value = (e.currentTarget as HTMLSelectElement).value;
            settings.setTransitionOverride(value === '' ? null : value);
            setForced(settings.transitionOverride());
          }}
        >
          <option value="">Random</option>
          {ids
            .filter((id) => id !== MINIMAL_ONLY)
            .map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
        </select>
      </label>
      {preview !== undefined && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={`Preview ${id}`}
              onClick={() => {
                const shown = preview(id);
                setNote(shown ? '' : 'Nothing to replay yet.');
                if (shown) onPreview?.();
              }}
            >
              {id}
            </button>
          ))}
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#555' }}>Minimal motion always crossfades.{note === '' ? '' : ` ${note}`}</div>
    </section>
  );
}

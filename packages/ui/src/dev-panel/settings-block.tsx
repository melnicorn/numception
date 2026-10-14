import { MOTION_LEVELS, type MotionLevel, type SettingsControls, type ThemeSelection } from '@numception/app';
import { useState } from 'preact/hooks';

const rowStyle = { display: 'block', margin: '4px 0' };

/** `text` as playlist ids: comma or space separated, blanks and repeats dropped. */
export function parsePlaylist(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).filter((id) => id !== ''))];
}

/**
 * Dev panel block: the active profile's Motion and theme settings (AD-21), each a
 * `SetSetting` (epic-profiles-and-controls' control surface builds on the same
 * commands). Shows the effective Motion level (the setting capped by OS Reduce
 * Motion). The playlist is typed as theme ids and applied on change.
 */
export function SettingsBlock({ settings }: { settings: SettingsControls }) {
  const [view, setView] = useState(() => settings.get());
  const [playlistText, setPlaylistText] = useState(() => (settings.get()?.settings.playlist ?? []).join(', '));
  const refresh = () => setView(settings.get());
  const s = view?.settings;
  if (view === null || s === undefined) {
    return (
      <section data-testid="dev-settings" style={{ marginTop: '8px' }}>
        No profile yet.
      </section>
    );
  }
  return (
    <section data-testid="dev-settings" aria-labelledby="dev-settings-heading" style={{ marginTop: '8px' }}>
      <h3 id="dev-settings-heading" style={{ margin: 0, fontSize: '13px' }}>
        Settings
      </h3>
      <label style={rowStyle}>
        Motion{' '}
        <select
          value={s.motion}
          onChange={(e) => {
            settings.set({ key: 'motion', value: (e.currentTarget as HTMLSelectElement).value as MotionLevel });
            refresh();
          }}
        >
          {MOTION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>{' '}
        <span data-testid="dev-effective-motion">(effective: {view.effectiveMotion})</span>
      </label>
      <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend style={{ fontSize: '13px' }}>Themes</legend>
        {(['randomize', 'playlist'] as const satisfies readonly ThemeSelection[]).map((selection) => (
          <label key={selection} style={{ marginRight: '8px' }}>
            <input
              type="radio"
              name="dev-theme-selection"
              checked={s.themeSelection === selection}
              onChange={() => {
                settings.set({ key: 'themeSelection', value: selection });
                refresh();
              }}
            />{' '}
            {selection === 'randomize' ? 'Randomize' : 'Playlist'}
          </label>
        ))}
      </fieldset>
      <label style={rowStyle}>
        Playlist{' '}
        <input
          type="text"
          value={playlistText}
          placeholder={settings.themeIds.join(', ')}
          onInput={(e) => setPlaylistText((e.currentTarget as HTMLInputElement).value)}
          onChange={(e) => {
            settings.set({ key: 'playlist', value: parsePlaylist((e.currentTarget as HTMLInputElement).value) });
            refresh();
            setPlaylistText((settings.get()?.settings.playlist ?? []).join(', '));
          }}
        />
      </label>
      <div style={{ fontSize: '12px', color: '#555' }}>Themes: {settings.themeIds.join(', ')}</div>
    </section>
  );
}

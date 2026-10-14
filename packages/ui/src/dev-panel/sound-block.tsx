import type { SettingsControls } from '@numception/app';
import { useState } from 'preact/hooks';

const labelStyle = { display: 'block', margin: '4px 0' };

/**
 * Dev panel block: the active profile's feedback settings (AD-21), each a
 * `SetSetting`. "Sound effects" gates every cue; "Music" has no content yet;
 * "Haptics" gates the solve taps (felt in the native shell only; on the web the
 * haptics port is a no-op).
 */
export function SoundBlock({ settings }: { settings: SettingsControls }) {
  const [view, setView] = useState(() => settings.get());
  const toggle = (key: 'effects' | 'haptics', value: boolean) => {
    settings.set({ key, value });
    setView(settings.get());
  };
  const s = view?.settings;
  return (
    <section data-testid="dev-sound" aria-labelledby="dev-sound-heading" style={{ marginTop: '8px' }}>
      <h3 id="dev-sound-heading" style={{ margin: 0, fontSize: '13px' }}>
        Sound
      </h3>
      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={s?.effects ?? true}
          disabled={s === undefined}
          onChange={(e) => toggle('effects', (e.currentTarget as HTMLInputElement).checked)}
        />{' '}
        Sound effects
      </label>
      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={s?.haptics ?? true}
          disabled={s === undefined}
          onChange={(e) => toggle('haptics', (e.currentTarget as HTMLInputElement).checked)}
        />{' '}
        Haptics
      </label>
      <label style={{ ...labelStyle, color: '#666' }}>
        <input type="checkbox" checked={s?.music ?? false} disabled /> Music (none yet)
      </label>
    </section>
  );
}

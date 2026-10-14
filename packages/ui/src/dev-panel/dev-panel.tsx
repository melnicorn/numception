import { roundInspectorOptions, type SettingsControls } from '@numception/app';
import { useMemo, useState } from 'preact/hooks';
import { PuzzleBlock } from './puzzle-block';
import { RoundInspector } from './round-inspector';
import { SettingsBlock } from './settings-block';
import { SoundBlock } from './sound-block';
import { TransitionBlock } from './transition-block';

/**
 * Id of the panel region. Also the dev-panel marker that tools/check-flavours.mjs
 * looks for: it must appear in dev and playtest builds and never in prod (AD-18).
 */
export const DEV_PANEL_ID = 'numception-dev-panel';

const toggleStyle = {
  position: 'fixed',
  right: 'calc(env(safe-area-inset-right) + 8px)',
  bottom: 'calc(env(safe-area-inset-bottom) + 8px)',
  zIndex: 1000,
  font: '12px system-ui, sans-serif',
  padding: '4px 8px',
};

const panelStyle = {
  position: 'fixed',
  right: 'calc(env(safe-area-inset-right) + 8px)',
  bottom: 'calc(env(safe-area-inset-bottom) + 40px)',
  zIndex: 1000,
  minWidth: '200px',
  // Stays usable on a phone: never wider or taller than the safe area (a Tower at
  // n = 9 lists 91 puzzles), scrolling inside itself.
  maxWidth: 'calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 16px)',
  maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 56px)',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
  boxSizing: 'border-box',
  padding: '8px 12px',
  background: '#fff',
  color: '#000',
  border: '1px solid #888',
  font: '14px system-ui, sans-serif',
};

/**
 * Dev panel: a toggle that opens the panel region. `tunings` maps every bundled
 * tuning's version to its JSON, as the composition root passed it in (AD-7); the
 * panel never loads tuning itself. The demo Puzzle block uses version 1 (else the
 * lowest); the round inspector can choose any of them. `settings`, when passed,
 * shows the profile settings (Motion, themes), the sound toggles and the
 * transition override; `preview` replays a round change as a given transition.
 */
export function DevPanel({
  tunings,
  settings,
  preview,
}: {
  tunings: Readonly<Record<string, unknown>>;
  settings?: SettingsControls;
  preview?: (transitionId: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => roundInspectorOptions(tunings), [tunings]);
  const demoTuning = options.defaultTuningVersion === undefined ? undefined : tunings[String(options.defaultTuningVersion)];
  return (
    <>
      <button
        type="button"
        style={toggleStyle}
        aria-expanded={open}
        // The section only exists while open, so only reference it then.
        aria-controls={open ? DEV_PANEL_ID : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        Dev panel
      </button>
      {open && (
        <section id={DEV_PANEL_ID} data-testid="dev-panel" aria-labelledby={`${DEV_PANEL_ID}-heading`} style={panelStyle}>
          <h2 id={`${DEV_PANEL_ID}-heading`} style={{ margin: 0, fontSize: '14px' }}>
            Dev panel
          </h2>
          {settings !== undefined && <SettingsBlock settings={settings} />}
          {settings !== undefined && <SoundBlock settings={settings} />}
          {settings !== undefined && (
            <TransitionBlock settings={settings} {...(preview === undefined ? {} : { preview })} onPreview={() => setOpen(false)} />
          )}
          <PuzzleBlock tuning={demoTuning} />
          <RoundInspector tunings={tunings} options={options} />
        </section>
      )}
    </>
  );
}

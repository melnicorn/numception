import { useState } from 'preact/hooks';
import { PuzzleBlock } from './puzzle-block';

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
  padding: '8px 12px',
  background: '#fff',
  color: '#000',
  border: '1px solid #888',
  font: '14px system-ui, sans-serif',
};

/**
 * Dev panel: a toggle that opens the panel region. `tuning` is the tuning JSON the
 * composition root bundled and passed in (AD-7); the panel never loads it itself.
 */
export function DevPanel({ tuning }: { tuning: unknown }) {
  const [open, setOpen] = useState(false);
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
          <PuzzleBlock tuning={tuning} />
        </section>
      )}
    </>
  );
}

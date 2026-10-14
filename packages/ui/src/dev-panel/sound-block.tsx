import type { FeedbackControls, FeedbackFlags } from '@numception/app';
import { useState } from 'preact/hooks';

const labelStyle = { display: 'block', margin: '4px 0' };

/**
 * Dev panel block: the feedback flags (dev flags until entry 4 moves them into
 * profile settings). "Sound effects" gates every cue; "Music" has no content yet.
 */
export function SoundBlock({ feedback }: { feedback: FeedbackControls }) {
  const [flags, setFlags] = useState<FeedbackFlags>(() => feedback.get());
  const update = (next: FeedbackFlags) => {
    feedback.set(next);
    setFlags(feedback.get());
  };
  return (
    <section data-testid="dev-sound" aria-labelledby="dev-sound-heading" style={{ marginTop: '8px' }}>
      <h3 id="dev-sound-heading" style={{ margin: 0, fontSize: '13px' }}>
        Sound
      </h3>
      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={flags.effects}
          onChange={(e) => update({ ...flags, effects: (e.currentTarget as HTMLInputElement).checked })}
        />{' '}
        Sound effects
      </label>
      <label style={{ ...labelStyle, color: '#666' }}>
        <input type="checkbox" checked={flags.music} disabled /> Music (none yet)
      </label>
    </section>
  );
}

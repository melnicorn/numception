import type { ThemeTokens } from '@numception/app';

/** Id of the guide-line slot (e2e and tests find it by its role and this id). */
export const GUIDE_LINE_ID = 'numception-guide-line';

/**
 * DESIGN `guide-text`: one short line in the guide-line slot above the puzzle,
 * `typography.guide` in the theme's face and `number` colour, on bare surface.
 * No box, no bubble. It is laid out in the slot the client mounts it in, a band
 * above the board that the board's fit never uses, so it never covers a cell;
 * and it never takes a tap (`pointer-events: none`). The live region is always in the DOM, so screen readers
 * announce the line when its text arrives (`role="status"`, `aria-live="polite"`).
 */
export function GuideLine(props: { readonly text: string | undefined; readonly theme: ThemeTokens | undefined }) {
  const { text, theme } = props;
  const style = {
    margin: 0,
    textAlign: 'center',
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    fontFamily: theme?.fontFamily ?? 'sans-serif',
    fontWeight: theme?.fontWeight ?? '500',
    fontSize: `${theme?.guideSizePx ?? 24}px`,
    lineHeight: 1.3,
    color: theme?.number ?? 'inherit',
  };
  return (
    <p id={GUIDE_LINE_ID} role="status" aria-live="polite" style={style}>
      {text ?? ''}
    </p>
  );
}

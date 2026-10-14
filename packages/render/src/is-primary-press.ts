/** The pointer fields `isPrimaryPress` reads. */
export type PressPointer = { readonly button: number; readonly isPrimary: boolean };

/**
 * Whether a pointer down or up is a play press: the primary pointer (first touch,
 * the pen, the mouse) with the main button (0). Right and middle clicks, extra
 * touches and pen barrel buttons are ignored.
 */
export function isPrimaryPress(event: PressPointer): boolean {
  return event.isPrimary && event.button === 0;
}

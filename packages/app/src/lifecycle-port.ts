/** A lifecycle change as the shell dispatches it (AD-16): `Pause` / `Resume` for `lifecycle`. */
export type LifecycleCommand = { readonly type: 'Pause'; readonly reason: 'lifecycle' } | { readonly type: 'Resume'; readonly reason: 'lifecycle' };

/**
 * The app lifecycle port (AD-16): the platform tells the shell when the app goes
 * to the background (`Pause { lifecycle }`) and comes back (`Resume { lifecycle }`).
 */
export type LifecyclePort = {
  /** Starts emitting to `listener` (at once, if the app is already in the background); returns the stop. */
  readonly start: (listener: (command: LifecycleCommand) => void) => () => void;
};

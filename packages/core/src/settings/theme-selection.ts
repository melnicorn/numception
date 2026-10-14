/** How a profile's next theme is chosen (AD-21, FR-25): drawn at random, or in the player's playlist order. */
export const THEME_SELECTIONS = ['randomize', 'playlist'] as const;

export type ThemeSelection = (typeof THEME_SELECTIONS)[number];

/** The most themes a playlist holds. */
export const MAX_PLAYLIST_LENGTH = 32;

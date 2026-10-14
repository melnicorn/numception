/**
 * A domain failure, discriminated by `code`. `message` is for developers only
 * (dev panel, logs); it is never shown to players.
 */
export type DomainError =
  | { readonly code: 'invalid-tuning'; readonly message: string; readonly issues: readonly string[] }
  | { readonly code: 'invalid-theme'; readonly message: string; readonly issues: readonly string[] }
  | { readonly code: 'invalid-transition'; readonly message: string; readonly issues: readonly string[] }
  | { readonly code: 'invalid-seed'; readonly message: string }
  | { readonly code: 'invalid-node-id'; readonly message: string }
  | { readonly code: 'invalid-spec'; readonly message: string }
  | { readonly code: 'unrealisable'; readonly message: string }
  | { readonly code: 'invalid-request'; readonly message: string }
  | { readonly code: 'unplannable'; readonly message: string }
  | { readonly code: 'invalid-cell'; readonly message: string }
  | { readonly code: 'invalid-bucket-id'; readonly message: string }
  | { readonly code: 'unsupported-version'; readonly message: string }
  | { readonly code: 'invalid-shape'; readonly message: string }
  | { readonly code: 'invalid-command'; readonly message: string }
  | { readonly code: 'invalid-save'; readonly message: string }
  | { readonly code: 'save-checksum-mismatch'; readonly message: string }
  | { readonly code: 'save-too-new'; readonly message: string };

/** Every `DomainError` code. */
export type DomainErrorCode = DomainError['code'];

/**
 * A domain failure, discriminated by `code`. `message` is for developers only
 * (dev panel, logs); it is never shown to players.
 */
export type DomainError =
  | { readonly code: 'invalid-tuning'; readonly message: string; readonly issues: readonly string[] }
  | { readonly code: 'invalid-seed'; readonly message: string }
  | { readonly code: 'invalid-node-id'; readonly message: string }
  | { readonly code: 'invalid-spec'; readonly message: string }
  | { readonly code: 'unsupported-version'; readonly message: string };

/** Every `DomainError` code. */
export type DomainErrorCode = DomainError['code'];

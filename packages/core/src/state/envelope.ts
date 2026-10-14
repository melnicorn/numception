import type { Command } from './command';
import type { CommandContext } from './command-context';

/** What `step` takes (AD-22): a command plus the time and entropy it runs with. */
export type Envelope = { readonly command: Command; readonly ctx: CommandContext };

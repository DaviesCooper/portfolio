import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * whoami — Print current user name.
 * Execute logic to be implemented.
 */
export class WhoamiCommand implements ICommand {
  readonly name = 'whoami';
  readonly description = 'Print current user name';

  execute(_args: string[], _context: CommandContext): CommandResult {
    return { stdout: 'Having a bit of an identity crisis are you? Sorry, friend. I can\'t help you with that.', stderr: '', exitCode: 0 };
  }
}

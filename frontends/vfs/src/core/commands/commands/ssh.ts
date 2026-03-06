import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * ssh — Open a secure shell connection to a remote host.
 * Execute logic to be implemented.
 */
export class SshCommand implements ICommand {
  readonly name = 'ssh';
  readonly description = 'Open secure shell connection to a remote host';

  execute(_args: string[], _context: CommandContext): CommandResult {
    return { stdout: 'ok I\'ll be quiet then...', stderr: '', exitCode: 1 };
  }
}

import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * ps — List processes.
 * Execute logic to be implemented.
 */
export class PsCommand implements ICommand {
  readonly name = 'ps';
  readonly description = 'List processes';

  execute(_args: string[], _context: CommandContext): CommandResult {
    return { stdout: '', stderr: '', exitCode: 0 };
  }
}

import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * pwd — Print the current working directory.
 * Uses context.cwd, which the shell keeps in sync when you run `cd`.
 */
export class PwdCommand implements ICommand {
  readonly name = 'pwd';
  readonly description = 'Print working directory';

  execute(_args: string[], context: CommandContext): CommandResult {
    return { stdout: context.cwd + '\n', stderr: '', exitCode: 0 };
  }
}

import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * echo — Write arguments to stdout.
 * - All args joined by a single space, then newline.
 * - -n: do not output the trailing newline.
 */
export class EchoCommand implements ICommand {
  readonly name = 'echo';
  readonly description = 'Write arguments to standard output';

  execute(args: string[], _context: CommandContext): CommandResult {
    const noNewline = args.length > 0 && args[0] === '-n';
    const rest = noNewline ? args.slice(1) : args;
    const stdout = rest.join(' ') + (noNewline ? '' : '\n');
    return { stdout, stderr: '', exitCode: 0 };
  }
}

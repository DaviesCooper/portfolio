import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * clear — Clear the terminal screen.
 * Sends ANSI escape sequences: \x1b[2J clears the whole screen,
 * \x1b[H moves the cursor to home (1,1). The xterm instance
 * interprets these and clears its display.
 */
export class ClearCommand implements ICommand {
  readonly name = 'clear';
  readonly description = 'Clear the terminal screen';

  execute(_args: string[], _context: CommandContext): CommandResult {
    return { stdout: '\x1b[2J\x1b[H', stderr: '', exitCode: 0 };
  }
}

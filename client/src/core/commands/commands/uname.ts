import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * uname — Print (fake) kernel/system info. Easter egg: with -a/--all,
 * sometimes returns meme-style lines instead of the real-looking line.
 */

export class UnameCommand implements ICommand {
  readonly name = 'uname';
  readonly description = 'Print system information';

  execute(args: string[], _context: CommandContext): CommandResult {
    // -a or --all: print full "kernel" line; otherwise just the nodename
    const showAll = args.includes('-a') || args.includes('--all');
    if (showAll) {
      return { stdout: 'Cooper Davies localhost 33 #33-Davies Sun Sep 27 4:00:00 UTC 1992 xBrain consciousnOS\n', stderr: '', exitCode: 0 };
    }
    return { stdout: 'CooperOS\n', stderr: '', exitCode: 0 };
  }
}

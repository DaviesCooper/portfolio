import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * cd — Change current working directory.
 * - No argument or "~" goes to /home/zigzalgo.
 * - Otherwise path is resolved relative to context.cwd (handles ., .., and absolutes).
 * - setCwd in the result tells the shell to update its cwd; the shell applies it after execute().
 */
export class CdCommand implements ICommand {
  readonly name = 'cd';
  readonly description = 'Change current directory';

  execute(args: string[], context: CommandContext): CommandResult {
    const pathArg = args[0] ?? '~';
    const path = context.resolvePath(pathArg);

    if (!context.fs.exists(path)) {
      return { stdout: '', stderr: `cd: ${pathArg}: No such file or directory\n`, exitCode: 1 };
    }
    if (!context.fs.isDirectory(path)) {
      return { stdout: '', stderr: `cd: ${pathArg}: Not a directory\n`, exitCode: 1 };
    }
    return { stdout: '', stderr: '', exitCode: 0, setCwd: path };
  }
}

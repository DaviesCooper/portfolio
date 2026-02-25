import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * find — Find files and directories.
 * Usage: find [path...]
 * - Traverses each path recursively (depth-first). Prints one path per line.
 * - If no path is given, uses current directory.
 * - Directories are listed before their contents; entries sorted by name.
 */
export class FindCommand implements ICommand {
  readonly name = 'find';
  readonly description = 'Find files and directories';

  execute(args: string[], context: CommandContext): CommandResult {
    const pathArgs = args.filter((a) => !a.startsWith('-'));
    const startPaths = pathArgs.length > 0 ? pathArgs : ['.'];

    let stdout = '';
    let stderr = '';

    for (const pathArg of startPaths) {
      const path = context.resolvePath(pathArg);
      if (!context.fs.exists(path)) {
        stderr += `find: '${pathArg}': No such file or directory\n`;
        continue;
      }

      const lines = this.walk(path, path, context);
      stdout += lines.join('\n');
      if (lines.length > 0) stdout += '\n';
    }

    return {
      stdout: stdout.replace(/\n+$/, '\n'),
      stderr,
      exitCode: stderr ? 1 : 0,
    };
  }

  private walk(absolutePath: string, _pathArg: string, context: CommandContext): string[] {
    const lines: string[] = [absolutePath];
    if (!context.fs.isDirectory(absolutePath)) return lines;

    const entries = context.fs.readDir(absolutePath);
    if (entries === null) return lines;

    const sorted = [...entries].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const node of sorted) {
      const childPath = absolutePath === '/' ? '/' + node.name : absolutePath + '/' + node.name;
      lines.push(...this.walk(childPath, _pathArg, context));
    }
    return lines;
  }
}

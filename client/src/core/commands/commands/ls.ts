import { ANSI_GREEN, ANSI_RESET } from '../../types/ansi';
import type { CommandContext, CommandResult, ICommand } from '../../types/command';

/**
 * ls — List directory contents (or a single file name if given a file path).
 * - Path: first non-option argument, or "." if none.
 * - -l / --long: long format (d/rw-r--r--, user, group, name with / for dirs).
 * - Directories listed before files, then alphabetically by name.
 */
export class LsCommand implements ICommand {
  readonly name = 'ls';
  readonly description = 'List directory contents';

  execute(args: string[], context: CommandContext): CommandResult {
    // First non-option argument is the path; default to current dir
    const pathArg = args.find(a => !a.startsWith('-')) ?? '.';
    const path = context.resolvePath(pathArg);
    const long = args.includes('-l') || args.includes('--long');

    if (!context.fs.exists(path)) {
      return { stdout: '', stderr: `ls: cannot access '${pathArg}': No such file or directory\n`, exitCode: 1 };
    }

    // Single file: just print its name
    if (context.fs.isFile(path)) {
      const node = context.fs.getNode(path);
      let name: string;
      if (node?.name != null) {
        name = node.name;
      } else {
        const parts = path.split('/');
        name = parts.pop() ?? path;
      }
      return { stdout: name + '\n', stderr: '', exitCode: 0 };
    }

    const entries = context.fs.readDir(path);
    if (entries === null) {
      return { stdout: '', stderr: `ls: cannot read directory '${path}'\n`, exitCode: 1 };
    }

    // Sort: directories first, then by name
    const sorted = [...entries].sort((a, b) => {
      if (a.kind !== b.kind) {
        if (a.kind === 'directory') return -1;
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

    const lines: string[] = [];
    for (const n of sorted) {
      const isDir = n.kind === 'directory';
      let suffix: string;
      if (isDir) suffix = '/';
      else suffix = '';
      let displayName: string;
      if (isDir) displayName = `${ANSI_GREEN}${n.name}${suffix}${ANSI_RESET}`;
      else displayName = n.name + suffix;

      if (long) {
        let typeChar: string;
        if (isDir) typeChar = 'd';
        else typeChar = '-';
        const longLine = `${typeChar}rw-r--r--  1 user group  ${displayName}`;
        lines.push(longLine);
      } else {
        lines.push(displayName);
      }
    }

    let trailingNewline: string;
    if (lines.length > 0) trailingNewline = '\n';
    else trailingNewline = '';
    return { stdout: lines.join('\n') + trailingNewline, stderr: '', exitCode: 0 };
  }
}

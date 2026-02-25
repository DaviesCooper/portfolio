import type { ICommand, CommandContext, CommandResult } from '../../types/command';

const RM_FLAGS = /^(-[rRf]+|--recursive|--force)$/;

/**
 * rm — Remove files or directories.
 * -r, -R, --recursive: allow removing directories.
 * -f, --force: don't error on nonexistent files; required to remove / (only rm -rf / clears root).
 * Without -r, removing a directory errors with "Is a directory".
 */
export class RmCommand implements ICommand {
  readonly name = 'rm';
  readonly description = 'Remove files or directories';

  execute(args: string[], context: CommandContext): CommandResult {
    let recursive = false;
    let force = false;
    const paths: string[] = [];
    for (const a of args) {
      if (RM_FLAGS.test(a)) {
        if (/r|R|recursive/.test(a)) recursive = true;
        if (/f|force/.test(a)) force = true;
        continue;
      }
      paths.push(a);
    }
    if (paths.length === 0) {
      return { stdout: '', stderr: 'rm: missing operand\n', exitCode: 1 };
    }

    let stderr = '';
    for (const pathArg of paths) {
      const path = context.resolvePath(pathArg);
      if (path === '/') {
        if (!recursive) {
          stderr += `rm: cannot remove '/': Is a directory\n`;
          continue;
        }
        if (!force) {
          stderr += `rm: cannot remove '/': Operation not permitted (use -f to force)\n`;
          continue;
        }
        const root = context.fs.getNode('/');
        if (root?.children) root.children.clear();
        context.onVfsRootCleared?.();
        continue;
      }
      if (!context.fs.exists(path)) {
        if (!force) stderr += `rm: cannot remove '${pathArg}': No such file or directory\n`;
        continue;
      }
      if (context.fs.isDirectory(path) && !recursive) {
        stderr += `rm: cannot remove '${pathArg}': Is a directory\n`;
        continue;
      }
      const parentPath = context.fs.resolve(path + '/..', context.cwd);
      const name = path.split('/').filter(Boolean).pop() ?? '';
      const parent = context.fs.getNode(parentPath);
      if (!parent?.children) {
        if (!force) stderr += `rm: cannot remove '${pathArg}': No such file or directory\n`;
        continue;
      }
      parent.children.delete(name);
    }
    return { stdout: '', stderr, exitCode: stderr ? 1 : 0 };
  }
}

import type { ICommand, CommandContext, CommandResult } from '../../types/command';
import { isValidFilename } from '../../types/reserved';

/**
 * mv — Move or rename files or directories.
 * - mv source dest — move source to dest (if dest is dir, move into it).
 * - mv source1 source2 ... dir — move all sources into dir.
 * - Cannot move a directory into itself or into a descendant.
 */
export class MvCommand implements ICommand {
  readonly name = 'mv';
  readonly description = 'Move or rename files or directories';

  execute(args: string[], context: CommandContext): CommandResult {
    const paths = args.filter((a) => !a.startsWith('-'));
    if (paths.length < 2) {
      return { stdout: '', stderr: 'mv: missing file operand\n', exitCode: 1 };
    }

    const sources = paths.slice(0, -1);
    const destArg = paths[paths.length - 1];
    const destResolved = context.resolvePath(destArg);

    let destDir: string;
    let destName: string;

    if (context.fs.exists(destResolved) && context.fs.isDirectory(destResolved)) {
      destDir = destResolved;
      destName = '';
    } else {
      if (sources.length > 1) {
        return { stdout: '', stderr: `mv: target '${destArg}' is not a directory\n`, exitCode: 1 };
      }
      destDir = context.fs.resolve(destResolved + '/..', context.cwd);
      destName = destResolved.split('/').filter(Boolean).pop() ?? '';
    }

    let stderr = '';
    for (const srcArg of sources) {
      const srcResolved = context.resolvePath(srcArg);
      if (!context.fs.exists(srcResolved)) {
        stderr += `mv: cannot stat '${srcArg}': No such file or directory\n`;
        continue;
      }
      const name = destName || (srcResolved.split('/').filter(Boolean).pop() ?? '');
      try {
        isValidFilename(name);
      } catch {
        stderr += `mv: invalid name '${name}'\n`;
        continue;
      }
      const node = context.fs.getNode(srcResolved);
      if (!node) continue;
      const srcParentPath = context.fs.resolve(srcResolved + '/..', context.cwd);
      const srcName = srcResolved.split('/').filter(Boolean).pop() ?? '';
      const srcParent = context.fs.getNode(srcParentPath);
      if (!srcParent?.children) continue;
      if (destDir === srcResolved || destDir.startsWith(srcResolved + '/')) {
        stderr += `mv: cannot move '${srcArg}' to a subdirectory of itself\n`;
        continue;
      }
      const destParent = context.fs.getNode(destDir);
      if (!destParent?.children) {
        stderr += `mv: cannot create '${destArg}': No such file or directory\n`;
        continue;
      }
      srcParent.children.delete(srcName);
      node.name = name;
      destParent.children.set(name, node);
    }

    return { stdout: '', stderr, exitCode: stderr ? 1 : 0 };
  }
}

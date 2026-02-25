import type { ICommand, CommandContext, CommandResult } from '../../types/command';
import { isValidFilename } from '../../types/reserved';
import { MIME_TEXT_PLAIN } from '../../types/mimeTypes';
import type { VfsNode } from '../../types/filesystem';

/**
 * touch — Create empty files or update file timestamps.
 * - Creates an empty text file at each path if it doesn't exist.
 * - If the path exists and is a file, succeeds (no-op).
 * - Directories and missing parent paths produce errors.
 */
export class TouchCommand implements ICommand {
  readonly name = 'touch';
  readonly description = 'Create empty files or update file timestamps';

  execute(args: string[], context: CommandContext): CommandResult {
    if (args.length === 0) {
      return { stdout: '', stderr: 'touch: missing file operand\n', exitCode: 1 };
    }

    const paths = args.filter((a) => !a.startsWith('-'));
    if (paths.length === 0) {
      return { stdout: '', stderr: 'touch: missing file operand\n', exitCode: 1 };
    }

    let stderr = '';
    for (const pathArg of paths) {
      const resolved = context.resolvePath(pathArg);
      if (context.fs.exists(resolved)) {
        if (context.fs.isDirectory(resolved)) {
          stderr += `touch: ${pathArg}: Is a directory\n`;
        }
        continue;
      }

      const parentPath = context.fs.resolve(resolved + '/..', context.cwd);
      if (!context.fs.exists(parentPath)) {
        stderr += `touch: ${pathArg}: No such file or directory\n`;
        continue;
      }
      if (!context.fs.isDirectory(parentPath)) {
        stderr += `touch: ${pathArg}: Not a directory\n`;
        continue;
      }

      const name = resolved.split('/').filter(Boolean).pop() ?? '';
      try {
        isValidFilename(name);
      } catch {
        stderr += `touch: ${pathArg}: Invalid filename\n`;
        continue;
      }

      const parent = context.fs.getNode(parentPath);
      if (!parent?.children) {
        stderr += `touch: ${pathArg}: No such file or directory\n`;
        continue;
      }
      const newNode: VfsNode = {
        kind: 'file',
        name,
        mimeType: MIME_TEXT_PLAIN,
        content: '',
      };
      parent.children.set(name, newNode);
    }

    return { stdout: '', stderr, exitCode: stderr ? 1 : 0 };
  }
}

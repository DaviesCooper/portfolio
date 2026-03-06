import type { ICommand, CommandContext, CommandResult } from '../../types/command';
import { isValidFilename } from '../../types/reserved';
import type { VfsNode } from '../../types/filesystem';

/**
 * cp — Copy files or directories.
 * - cp [-r] source dest — copy source to dest (if dest is dir, copy as dest/sourceName).
 * - cp [-r] source1 source2 ... dir — copy all sources into dir.
 * - -r/--recursive: copy directories recursively.
 */
export class CpCommand implements ICommand {
  readonly name = 'cp';
  readonly description = 'Copy files or directories';

  execute(args: string[], context: CommandContext): CommandResult {
    const opts = args.filter((a) => a.startsWith('-'));
    const paths = args.filter((a) => !a.startsWith('-'));
    const recursive = opts.includes('-r') || opts.includes('-R') || opts.includes('--recursive');

    if (paths.length < 2) {
      return { stdout: '', stderr: 'cp: missing file operand\n', exitCode: 1 };
    }

    const sources = paths.slice(0, -1);
    const destArg = paths[paths.length - 1];
    const destResolved = context.resolvePath(destArg);

    let destDir: string;
    let destName: string;

    if (context.fs.exists(destResolved) && context.fs.isDirectory(destResolved)) {
      destDir = destResolved;
      destName = ''; // use source basename for each
    } else {
      if (sources.length > 1) {
        return { stdout: '', stderr: `cp: target '${destArg}' is not a directory\n`, exitCode: 1 };
      }
      destDir = context.fs.resolve(destResolved + '/..', context.cwd);
      destName = destResolved.split('/').filter(Boolean).pop() ?? '';
    }

    let stderr = '';
    for (const srcArg of sources) {
      const srcResolved = context.resolvePath(srcArg);
      if (!context.fs.exists(srcResolved)) {
        stderr += `cp: cannot stat '${srcArg}': No such file or directory\n`;
        continue;
      }
      const name = destName || (srcResolved.split('/').filter(Boolean).pop() ?? '');
      try {
        isValidFilename(name);
      } catch {
        stderr += `cp: invalid name '${name}'\n`;
        continue;
      }
      const node = context.fs.getNode(srcResolved);
      if (!node) continue;
      if (node.kind === 'directory' && !recursive) {
        stderr += `cp: -r not specified; omitting directory '${srcArg}'\n`;
        continue;
      }
      const parent = context.fs.getNode(destDir);
      if (!parent?.children) {
        stderr += `cp: cannot create '${destArg}': No such file or directory\n`;
        continue;
      }
      if (destDir === srcResolved || destDir.startsWith(srcResolved + '/')) {
        stderr += `cp: cannot copy a directory '${srcArg}' into itself\n`;
        continue;
      }
      try {
        const copy = this.cloneNode(node);
        copy.name = name;
        parent.children.set(name, copy);
      } catch (e) {
        stderr += `cp: ${srcArg}: ${(e as Error).message}\n`;
      }
    }

    return { stdout: '', stderr, exitCode: stderr ? 1 : 0 };
  }

  private cloneNode(node: VfsNode): VfsNode {
    if (node.kind === 'file') {
      return {
        kind: 'file',
        name: node.name,
        mimeType: node.mimeType,
        content: node.content,
        base64: node.base64,
        url: node.url,
      };
    }
    const children = new Map<string, VfsNode>();
    if (node.children) {
      for (const [k, v] of node.children) {
        children.set(k, this.cloneNode(v));
      }
    }
    return { kind: 'directory', name: node.name, children };
  }
}

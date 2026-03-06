import { TEXT_MIMES } from '../../types/mimeTypes';
import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * cat — Print file contents to stdout.
 * - Multiple paths: concatenate each in order (errors go to stderr but we keep going).
 * - Text MIMEs: full content via readFileUtf8.
 * - Other (binary): single line "[Binary file: filename]".
 * - Directories and missing files produce error lines and exitCode 1.
 */
export class CatCommand implements ICommand {
  readonly name = 'cat';
  readonly description = 'Concatenate and print files';

  async execute(args: string[], context: CommandContext): Promise<CommandResult> {
    if (args.length === 0) {
      const fromStdin = context.stdin ?? '';
      return { stdout: fromStdin.endsWith('\n') ? fromStdin : fromStdin + '\n', stderr: '', exitCode: 0 };
    }
    let out = '';
    let err = '';
    for (const pathArg of args) {
      const path = context.resolvePath(pathArg);
      if (!context.fs.exists(path)) {
        err += `cat: ${pathArg}: No such file or directory\n`;
        continue;
      }
      if (context.fs.isDirectory(path)) {
        err += `cat: ${pathArg}: Is a directory\n`;
        continue;
      }
      try {
        const node = context.fs.getNode(path);
        const mime = node?.mimeType ?? 'text/plain';
        if (TEXT_MIMES.has(mime) || mime.startsWith('text/')) {
          let text = context.fs.readFileUtf8(path);
          if (text instanceof Promise) text = await text;
          out += text;
          if (!out.endsWith('\n')) out += '\n';
        } else {
          out += `[Binary file: ${node?.name ?? pathArg}]\n`;
        }
      } catch (e) {
        err += `cat: ${pathArg}: ${(e as Error).message}\n`;
      }
    }
    return { stdout: out, stderr: err, exitCode: err ? 1 : 0 };
  }
}

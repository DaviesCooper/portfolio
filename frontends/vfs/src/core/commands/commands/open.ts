import { MIME_APPLICATION_OCTET_STREAM, TEXT_MIMES } from '../../types/mimeTypes';
import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * open — Open a file in a new window using the right viewer.
 * Text/markdown is passed as string; binary (images, audio, video, PDF) is passed
 * as ArrayBuffer. The app creates blob URLs for binary and opens a window;
 * the ViewerRegistry picks the component by MIME type.
 */
export class OpenCommand implements ICommand {
  readonly name = 'open';
  readonly description = 'Open file';

  async execute(args: string[], context: CommandContext): Promise<CommandResult> {
    if (args.length === 0) {
      return { stdout: '', stderr: 'open: usage: open <file>\n', exitCode: 1 };
    }
    const pathArg = args[0];
    const path = context.resolvePath(pathArg);

    if (!context.fs.exists(path)) {
      return { stdout: '', stderr: `open: ${pathArg}: No such file or directory\n`, exitCode: 1 };
    }
    if (context.fs.isDirectory(path)) {
      return { stdout: '', stderr: `open: ${pathArg}: Is a directory\n`, exitCode: 1 };
    }
    try {
      const node = context.fs.getNode(path);
      const mimeType = node?.mimeType ?? MIME_APPLICATION_OCTET_STREAM;
      if (TEXT_MIMES.has(mimeType)) {
        let text = context.fs.readFileUtf8(path);
        if (text instanceof Promise) text = await text;
        const sourceUrl = node?.kind === 'file' && node.url ? node.url : undefined;
        context.openInViewer(path, mimeType, text, sourceUrl ? { sourceUrl } : undefined);
      } else {
        let content = context.fs.readFile(path);
        if (content instanceof Promise) content = await content;
        const buf = content instanceof ArrayBuffer ? content : new Uint8Array(content).buffer;
        context.openInViewer(path, mimeType, buf);
      }
      return { stdout: `Opened ${pathArg}\n`, stderr: '', exitCode: 0 };
    } catch (e) {
      return { stdout: '', stderr: `open: ${pathArg}: ${(e as Error).message}\n`, exitCode: 1 };
    }
  }
}

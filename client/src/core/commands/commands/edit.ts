import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * edit — Open a file in the text editor (like vim).
 * If the file does not exist, it is created on save.
 */
export class EditCommand implements ICommand {
  readonly name = 'edit';
  readonly description = 'Opens a text editor';

  async execute(args: string[], context: CommandContext): Promise<CommandResult> {
    if (args.length === 0) {
      return { stdout: '', stderr: 'edit: missing file argument\n', exitCode: 1 };
    }
    const rawPath = args[0];
    const filePath = context.resolvePath(rawPath);
    const filename = filePath.split('/').filter(Boolean).pop() ?? rawPath;

    let initialContent = '';
    if (context.fs.exists(filePath)) {
      if (context.fs.isDirectory(filePath)) {
        return { stdout: '', stderr: `edit: ${filePath}: is a directory\n`, exitCode: 1 };
      }
      const content = context.fs.readFileUtf8(filePath);
      initialContent = typeof content === 'string' ? content : await content;
    }

    context.windowHost.openWindow({
      type: 'editor',
      title: filename,
      minimized: false,
      maximized: false,
      payload: { filePath, filename, text: initialContent },
    });
    return { stdout: '', stderr: '', exitCode: 0 };
  }
}

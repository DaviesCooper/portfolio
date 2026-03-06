import { TEXT_MIMES } from '../../types/mimeTypes';
import type { ICommand, CommandContext, CommandResult } from '../../types/command';

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * wc — Print line, word, and byte counts. -l -w -c; default all. Reads from FS or stdin.
 */
export class WcCommand implements ICommand {
  readonly name = 'wc';
  readonly description = 'Print line, word, and byte counts';

  async execute(args: string[], context: CommandContext): Promise<CommandResult> {
    const opts = args.filter(a => a.startsWith('-'));
    const pathArgs = args.filter(a => !a.startsWith('-'));
    const doLines = opts.length === 0 || opts.some(o => o === '-l' || o === '--lines');
    const doWords = opts.length === 0 || opts.some(o => o === '-w' || o === '--words');
    const doBytes = opts.length === 0 || opts.some(o => o === '-c' || o === '--bytes');
    const hasStdin = context.stdin !== undefined;

    const files: { pathArg: string; path: string }[] = [];
    for (const pathArg of pathArgs) {
      files.push({ pathArg, path: context.resolvePath(pathArg) });
    }
    if (files.length === 0 && !hasStdin) {
      return { stdout: '', stderr: 'wc: missing file operand\n', exitCode: 1 };
    }

    let stdout = '';
    let stderr = '';
    let totalLines = 0;
    let totalWords = 0;
    let totalBytes = 0;
    const results: { lines: number; words: number; bytes: number; label: string }[] = [];

    if (hasStdin && files.length === 0) {
      const text = context.stdin ?? '';
      const lines = text.split(/\r?\n/).length - (text.endsWith('\n') ? 0 : 1);
      if (!text && lines === -1) results.push({ lines: 0, words: 0, bytes: 0, label: '(standard input)' });
      else results.push({ lines: Math.max(0, lines), words: countWords(text), bytes: new TextEncoder().encode(text).length, label: '(standard input)' });
    }

    for (const { pathArg, path } of files) {
      if (!context.fs.exists(path)) {
        stderr += `wc: ${pathArg}: No such file or directory\n`;
        continue;
      }
      if (context.fs.isDirectory(path)) {
        stderr += `wc: ${pathArg}: Is a directory\n`;
        continue;
      }
      const node = context.fs.getNode(path);
      const mime = node?.mimeType ?? 'text/plain';
      let text: string;
      if (TEXT_MIMES.has(mime) || (mime && mime.startsWith('text/'))) {
        try {
          let t = context.fs.readFileUtf8(path);
          if (t instanceof Promise) t = await t;
          text = t;
        } catch (e) {
          stderr += `wc: ${pathArg}: ${(e as Error).message}\n`;
          continue;
        }
      } else {
        results.push({ lines: 0, words: 0, bytes: 0, label: pathArg });
        totalLines += 0;
        totalWords += 0;
        totalBytes += 0;
        continue;
      }
      const lines = text.split(/\r?\n/).length - (text.endsWith('\n') ? 0 : 1);
      const lineCount = Math.max(0, lines);
      const wordCount = countWords(text);
      const byteCount = new TextEncoder().encode(text).length;
      results.push({ lines: lineCount, words: wordCount, bytes: byteCount, label: pathArg });
      totalLines += lineCount;
      totalWords += wordCount;
      totalBytes += byteCount;
    }

    for (const r of results) {
      const cols: string[] = [];
      if (doLines) cols.push(String(r.lines));
      if (doWords) cols.push(String(r.words));
      if (doBytes) cols.push(String(r.bytes));
      stdout += cols.join(' ').padStart(7) + ' ' + r.label + '\n';
    }
    if (results.length > 1) {
      const cols: string[] = [];
      if (doLines) cols.push(String(totalLines));
      if (doWords) cols.push(String(totalWords));
      if (doBytes) cols.push(String(totalBytes));
      stdout += cols.join(' ').padStart(7) + ' total\n';
    }

    return { stdout, stderr, exitCode: stderr ? 1 : 0 };
  }
}

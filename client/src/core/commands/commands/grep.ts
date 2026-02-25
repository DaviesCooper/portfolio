import { TEXT_MIMES } from '../../types/mimeTypes';
import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/**
 * grep — Search for a pattern in files or stdin.
 * - grep [options] pattern [file...]. Pattern required; files optional when stdin is provided (e.g. pipeline).
 * - -i: ignore case. -E: extended regex. -n: line numbers. -l: print filename only. -r: recursive.
 * - Text files: match line by line. Binary files: skip (stderr message). Directories: error unless -r.
 */
export class GrepCommand implements ICommand {
  readonly name = 'grep';
  readonly description = 'Search for a pattern in input or files';

  async execute(args: string[], context: CommandContext): Promise<CommandResult> {
    const opts = args.filter((a) => a.startsWith('-'));
    const rest = args.filter((a) => !a.startsWith('-'));
    if (rest.length === 0) {
      return { stdout: '', stderr: 'grep: missing pattern\n', exitCode: 1 };
    }
    const pattern = rest[0];
    const fileArgs = rest.slice(1);
    const hasStdin = context.stdin !== undefined;
    if (fileArgs.length === 0 && !hasStdin) {
      return { stdout: '', stderr: 'grep: missing file operand\n', exitCode: 1 };
    }
    const ignoreCase = opts.includes('-i');
    const extended = opts.includes('-E');
    const lineNumbers = opts.includes('-n');
    const filesOnly = opts.includes('-l');
    const recursive = opts.includes('-r') || opts.includes('--recursive');

    let flags = 'g';
    if (ignoreCase) flags += 'i';
    let re: RegExp;
    try {
      re = new RegExp(extended ? pattern : escapeRegex(pattern), flags);
    } catch {
      return { stdout: '', stderr: 'grep: invalid pattern\n', exitCode: 1 };
    }

    let stdout = '';
    let stderr = '';
    const filesToSearch: { pathArg: string; path: string }[] = [];
    for (const pathArg of fileArgs) {
      const path = context.resolvePath(pathArg);
      if (!context.fs.exists(path)) {
        stderr += `grep: ${pathArg}: No such file or directory\n`;
        continue;
      }
      if (context.fs.isDirectory(path)) {
        if (!recursive) {
          stderr += `grep: ${pathArg}: Is a directory\n`;
          continue;
        }
        this.collectFiles(context, path, pathArg, filesToSearch);
      } else {
        filesToSearch.push({ pathArg, path });
      }
    }

    let hadMatch = false;
    for (const { pathArg, path } of filesToSearch) {
      const result = await this.searchFile(context, path, pathArg, re, lineNumbers, filesOnly);
      if (result.stdout) hadMatch = true;
      stdout += result.stdout;
      stderr += result.stderr;
    }

    if (fileArgs.length === 0 && hasStdin) {
      const stdinResult = this.searchText(context.stdin ?? '', re, lineNumbers, filesOnly, '(standard input)');
      if (stdinResult) hadMatch = true;
      stdout += stdinResult;
    }

    return { stdout, stderr, exitCode: stderr ? 1 : (hadMatch ? 0 : 1) };
  }

  private searchText(
    text: string,
    re: RegExp,
    lineNumbers: boolean,
    filesOnly: boolean,
    label: string
  ): string {
    const lines = text.split(/\r?\n/);
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      re.lastIndex = 0;
      if (re.test(lines[i])) {
        if (filesOnly) {
          out.push(label + '\n');
          break;
        }
        const prefix = lineNumbers ? `${i + 1}:` : '';
        out.push(prefix + lines[i] + '\n');
      }
    }
    return out.join('');
  }

  private collectFiles(
    context: CommandContext,
    dirPath: string,
    dirArg: string,
    out: { pathArg: string; path: string }[]
  ): void {
    const entries = context.fs.readDir(dirPath);
    if (!entries) return;
    for (const entry of entries) {
      const childPath = dirPath === '/' ? '/' + entry.name : dirPath + '/' + entry.name;
      const childArg = dirArg.endsWith('/') ? dirArg + entry.name : dirArg + '/' + entry.name;
      if (entry.kind === 'directory') {
        this.collectFiles(context, childPath, childArg, out);
      } else {
        out.push({ pathArg: childArg, path: childPath });
      }
    }
  }

  private async searchFile(
    context: CommandContext,
    path: string,
    pathArg: string,
    re: RegExp,
    lineNumbers: boolean,
    filesOnly: boolean
  ): Promise<{ stdout: string; stderr: string }> {
    const node = context.fs.getNode(path);
    const mime = node?.mimeType ?? 'text/plain';
    if (!TEXT_MIMES.has(mime) && !mime.startsWith('text/')) {
      return { stdout: '', stderr: `grep: ${pathArg}: Binary file\n` };
    }
    let text: string;
    try {
      let t = context.fs.readFileUtf8(path);
      if (t instanceof Promise) t = await t;
      text = t;
    } catch (e) {
      return { stdout: '', stderr: `grep: ${pathArg}: ${(e as Error).message}\n` };
    }
    const lines = text.split(/\r?\n/);
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      re.lastIndex = 0;
      if (re.test(lines[i])) {
        if (filesOnly) {
          out.push(pathArg + '\n');
          break;
        }
        const prefix = lineNumbers ? `${i + 1}:` : '';
        out.push(prefix + lines[i] + '\n');
      }
    }
    return { stdout: out.join(''), stderr: '' };
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

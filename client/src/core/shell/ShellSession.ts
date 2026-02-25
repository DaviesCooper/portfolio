import type { CommandContext, CommandResult } from '../types/command';
import type { CommandRegistry } from '../commands/CommandRegistry';

export interface ShellSessionState {
  cwd: string;
  env: Record<string, string>;
}

/**
 * Shell session: holds cwd/env and runs commands through the registry.
 * Single responsibility: parse input, dispatch to command, apply side effects (setCwd).
 */
export class ShellSession {
  private state: ShellSessionState = {
    cwd: '/home/cooper',
    env: { USER: 'cooper', HOME: '/home/cooper', PATH: '/usr/bin' },
  };

  constructor(private readonly registry: CommandRegistry) {}

  getCwd(): string {
    return this.state.cwd;
  }

  getEnv(): Record<string, string> {
    return { ...this.state.env };
  }

  setCwd(cwd: string): void {
    this.state.cwd = cwd;
  }

  async run(
    line: string,
    context: Omit<CommandContext, 'cwd' | 'env' | 'resolvePath'>
  ): Promise<CommandResult> {
    const trimmed = line.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    const parts = this.splitByControlOperators(trimmed);
    let lastResult: CommandResult = { stdout: '', stderr: '', exitCode: 0 };
    let allStdout = '';
    let allStderr = '';

    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i].segment.trim();
      const op = parts[i].op;

      if (!segment) {
        const token = op === ';' ? ';' : op === '&&' ? '&&' : '||';
        return { stdout: '', stderr: `bash: syntax error near unexpected token '${token}'\n`, exitCode: 1 };
      }

      const result = await this.runPipeline(segment, context);
      lastResult = result;
      allStdout += result.stdout;
      allStderr += result.stderr;

      if (op === null) return { stdout: allStdout, stderr: allStderr, exitCode: lastResult.exitCode };
      if (op === ';') continue;
      if (op === '&&' && result.exitCode !== 0) return { stdout: allStdout, stderr: allStderr, exitCode: lastResult.exitCode };
      if (op === '||' && result.exitCode === 0) return { stdout: allStdout, stderr: allStderr, exitCode: lastResult.exitCode };
    }

    return { stdout: allStdout, stderr: allStderr, exitCode: lastResult.exitCode };
  }

  /**
   * Runs a single pipeline (one or more commands connected by |). Returns the last command's result.
   */
  private async runPipeline(
    line: string,
    context: Omit<CommandContext, 'cwd' | 'env' | 'resolvePath'>
  ): Promise<CommandResult> {
    const segments = this.splitPipeline(line);
    let stdin: string | undefined;
    let lastResult: CommandResult = { stdout: '', stderr: '', exitCode: 0 };
    const allStderr: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();
      if (!segment) {
        return { stdout: '', stderr: `bash: syntax error near unexpected token '|'\n`, exitCode: 1 };
      }
      const parts = this.parseLine(segment);
      const name = parts[0];
      const args = parts.slice(1);

      const cmd = this.registry.get(name);
      if (!cmd) {
        return {
          stdout: '',
          stderr: `bash: ${name}: command not found\n`,
          exitCode: 127,
        };
      }

      const home = this.state.env.HOME ?? '/home/guest';
      const resolvePath = (path: string): string => {
        const expanded = path === '~' ? home : path.startsWith('~/') ? home + path.slice(1) : path;
        return context.fs.resolve(expanded, this.state.cwd);
      };
      const fullContext: CommandContext = {
        ...context,
        cwd: this.state.cwd,
        env: this.state.env,
        resolvePath,
        stdin,
      };

      const result = await cmd.execute(args, fullContext);
      lastResult = result;
      if (result.stderr) allStderr.push(result.stderr);
      stdin = result.stdout;
      if (i === 0 && result.setCwd) this.state.cwd = result.setCwd;
    }

    return {
      stdout: lastResult.stdout,
      stderr: allStderr.join(''),
      exitCode: lastResult.exitCode,
    };
  }

  /**
   * Splits a line on unquoted ; && and ||. Returns segments with the operator that follows (null for the last).
   */
  private splitByControlOperators(line: string): { segment: string; op: ';' | '&&' | '||' | null }[] {
    const result: { segment: string; op: ';' | '&&' | '||' | null }[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuote) {
        if (c === quoteChar) inQuote = false;
        current += c;
        continue;
      }
      if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        current += c;
        continue;
      }
      if (c === '|' && line[i + 1] === '|') {
        result.push({ segment: current.trim(), op: '||' });
        current = '';
        i++;
        continue;
      }
      if (c === '&' && line[i + 1] === '&') {
        result.push({ segment: current.trim(), op: '&&' });
        current = '';
        i++;
        continue;
      }
      if (c === ';') {
        result.push({ segment: current.trim(), op: ';' });
        current = '';
        continue;
      }
      current += c;
    }
    result.push({ segment: current.trim(), op: null });
    return result;
  }

  /**
   * Splits a command line on unquoted | into pipeline segments.
   * e.g. `echo "a | b" | cat` → ['echo "a | b"', 'cat'].
   */
  private splitPipeline(line: string): string[] {
    const segments: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuote) {
        if (c === quoteChar) inQuote = false;
        current += c;
        continue;
      }
      if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        current += c;
        continue;
      }
      if (c === '|') {
        segments.push(current);
        current = '';
        continue;
      }
      current += c;
    }
    segments.push(current);
    return segments;
  }

  /**
   * Splits a command line into tokens (parts), respecting quoted strings.
   * Single and double quotes are supported; spaces and tabs outside quotes
   * separate tokens. Characters inside quotes are kept as one token and
   * the quote characters themselves are not included in the result.
   *
   * @param line - The raw command line string (e.g. `echo "hello world"`).
   * @returns Array of token strings (e.g. `["echo", "hello world"]`).
   */
  private parseLine(line: string): string[] {
    const parts: string[] = []; // Accumulated tokens
    let current = ''; // Token being built
    let inQuote = false; // Whether we're inside a quoted span
    let quoteChar = ''; // The quote that started this span (" or ')

    for (let i = 0; i < line.length; i++) {
      const c = line[i];

      // Inside a quoted span: only the matching closing quote ends it
      if (inQuote) {
        if (c === quoteChar) inQuote = false; // Closing quote; exit quoted span
        else current += c; // Any other char goes into the current token
        continue;
      }

      // Start of a quoted span
      if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        continue;
      }

      // Whitespace outside quotes: finish current token and skip
      if (c === ' ' || c === '\t') {
        if (current) {
          parts.push(current);
          current = '';
        }
        continue;
      }

      // Regular character: append to current token
      current += c;
    }

    // Don't drop the last token if the line doesn't end with whitespace
    if (current) parts.push(current);
    return parts;
  }
}

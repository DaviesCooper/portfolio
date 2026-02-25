/**
 * Command system types — SRP: one interface for all shell commands.
 * New commands implement ICommand without modifying existing code (OCP).
 */

import type { IVirtualFilesystem } from './filesystem';
import type { IWindowHost } from './window';

export interface CommandContext {
  cwd: string;
  env: Record<string, string>;
  fs: IVirtualFilesystem;
  /** Resolve a path: ~ and ~/ expand to $HOME, / is root, then resolve relative to cwd. */
  resolvePath: (path: string) => string;
  /** When running in a pipeline, stdin is the previous command's stdout. Omitted for the first command. */
  stdin?: string;
  /** Open a file in the appropriate viewer window. sourceUrl resolves relative links/images (e.g. for markdown). */
  openInViewer: (path: string, mimeType: string, content: ArrayBuffer | string, options?: { sourceUrl?: string }) => void;
  /** Host for creating/focusing windows (e.g. "open terminal"). */
  windowHost: IWindowHost;
  /** Called when the vFS root is cleared (e.g. after rm -rf /). */
  onVfsRootCleared?: () => void;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** If set, shell should change current working directory to this path. */
  setCwd?: string;
}

/** Single Responsibility: each command is one class. Open/Closed: extend by adding new commands. */
export interface ICommand {
  readonly name: string;
  readonly description?: string;
  execute(args: string[], context: CommandContext): CommandResult | Promise<CommandResult>;
}

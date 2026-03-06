import type { ICommand, CommandContext, CommandResult } from '../../types/command';
import { isValidFilename } from '../../types/reserved';

/**
 * mkdir — Create directories.
 * Execute logic to be implemented.
 */
export class MkdirCommand implements ICommand {
  readonly name = 'mkdir';
  readonly description = 'Create directories';

  execute(args: string[], context: CommandContext): CommandResult {
    if (args.length === 0) {
      return { stdout: '', stderr: 'mkdir: missing operand\n', exitCode: 1 };
    }

    const filteredArgs = args.filter((a) => !a.startsWith('-'));
    if (filteredArgs.length === 0) {
      return { stdout: '', stderr: 'mkdir: missing operand\n', exitCode: 1 };
    }
    if (filteredArgs.length > 1) {
      return { stdout: '', stderr: 'mkdir: too many operands\n', exitCode: 1 };
    }

    const makeParents = args.includes('-p') || args.includes('--parents');
    const verbose = args.includes('-v') || args.includes('--verbose');

    return this.makeDirectory(filteredArgs[0], context, makeParents, verbose);
  }



  makeDirectory(path: string, context: CommandContext, makeParents: boolean, verbose: boolean): CommandResult {
    // Check if the Parent directory resolves

    const resolvedPath = context.resolvePath(path);
    
    if(context.fs.exists(resolvedPath)) {
      return { stdout: '', stderr: `mkdir: ${resolvedPath}: File or directory already exists\n`, exitCode: 1 };
    }

    try {
      const output = this.makeDirectoryRecursive(resolvedPath, context, makeParents, verbose);
      if (verbose)
        return { stdout: output, stderr: '', exitCode: 0 };
      else
        return { stdout: `mkdir: created directory ${path}\n`, stderr: '', exitCode: 0 };
    }
    catch (e) {
      return { stdout: '', stderr: `mkdir: ${resolvedPath}: ${(e as Error).message}\n`, exitCode: 1 };
    }



  }

  makeDirectoryRecursive(resolvedPath: string, context: CommandContext, makeParents: boolean, verbose: boolean): string {

    let output = ""
    // Check if the path already exists
    if (context.fs.exists(resolvedPath)) {
      if (context.fs.isDirectory(resolvedPath))
        return output;
      if (context.fs.isFile(resolvedPath))
        throw new Error("Is a file.")
    }

    const rawName = resolvedPath.split('/').pop() ?? '';
    if (!isValidFilename(rawName)) {
      throw new Error(`Invalid character in name ${rawName}`);
    }
    const parentPath = context.fs.resolve(resolvedPath + '/..', context.cwd);

    // If the parent does not exist
    if (!context.fs.exists(parentPath)) {
      console.log("parent does not exist", parentPath);
      if (!makeParents)
        throw new Error(`${parentPath} does not exist.`)
      else
        output = this.makeDirectoryRecursive(parentPath, context, makeParents, verbose);
    }

    // At this point the parent will exist because we either made it
    // or we threw because we don't want to make parents.
    if (context.fs.isDirectory(parentPath)) {
      const parent = context.fs.getNode(parentPath);
      if(!parent) throw new Error('Parent does not exist.');
      if (!parent.children) parent.children = new Map();
      parent.children.set(rawName, { kind: 'directory', name: rawName, children: new Map() });
      if (verbose) return `mkdir: created directory ${resolvedPath}\n` + output;
      return '';
    }

    // Our parent is not a directory
    throw new Error("Parent is not a directory.")
  }
}

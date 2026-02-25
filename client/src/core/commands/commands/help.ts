import type { ICommand, CommandContext, CommandResult } from '../../types/command';
import type { CommandRegistry } from '../CommandRegistry';

/**
 * help — List all registered commands and their descriptions.
 * Uses the CommandRegistry (injected in the constructor) so it stays in sync
 * when you add new commands to the registry.
 */
export class HelpCommand implements ICommand {
  readonly name = 'help';
  readonly description = 'List available commands';

  constructor(private readonly registry: CommandRegistry) {}

  execute(_args: string[], _context: CommandContext): CommandResult {
    const lines = this.registry.all()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => `  ${c.name.padEnd(12)} ${c.description ?? ''}`);
    return {
      stdout: 'Available commands:\n' + lines.join('\n') + '\n',
      stderr: '',
      exitCode: 0,
    };
  }
}

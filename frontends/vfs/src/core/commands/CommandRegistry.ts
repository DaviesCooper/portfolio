import type { ICommand } from '../types/command';

/**
 * Registry of shell commands — Dependency Inversion: depend on ICommand, not concrete commands.
 * Open/Closed: add new commands by registering, no need to change registry.
 */
export class CommandRegistry {
  private commands = new Map<string, ICommand>();

  register(cmd: ICommand): this {
    this.commands.set(cmd.name.toLowerCase(), cmd);
    return this;
  }

  get(name: string): ICommand | undefined {
    return this.commands.get(name.toLowerCase());
  }

  has(name: string): boolean {
    return this.commands.has(name.toLowerCase());
  }

  names(): string[] {
    return Array.from(this.commands.keys()).sort();
  }

  all(): ICommand[] {
    return Array.from(this.commands.values());
  }
}

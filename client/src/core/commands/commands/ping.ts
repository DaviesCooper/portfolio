import type { ICommand, CommandContext, CommandResult } from '../../types/command';

/** Options that take a numeric argument (short and long). */
const PING_OPTIONS_WITH_ARG = new Set(['-c', '-i', '-s', '-W', '--count', '--interval', '--size', '--timeout']);
/** All supported long/short option names (without values). */
const PING_KNOWN_OPTIONS = new Set([
  '-c', '-i', '-s', '-W',
  '-4', '-6', '-v',
  '--count', '--interval', '--size', '--timeout',
  '--verbose',
]);

/**
 * ping — Validate ping arguments (no actual network call).
 * Execute is disabled for safety; all args are still validated.
 */
export class PingCommand implements ICommand {
  readonly name = 'ping';
  readonly description = 'Ping a remote host';

  execute(args: string[], _context: CommandContext): CommandResult {
    const validation = this.validateArgs(args);
    if (validation) return validation;

    return {
      stdout: '',
      stderr: "Pong.\n",
      exitCode: 1,
    };
  }

  private validateArgs(args: string[]): CommandResult | null {
    const operands = args.filter((a) => !a.startsWith('-'));
    if (operands.length === 0) {
      return { stdout: '', stderr: 'ping: missing host\n', exitCode: 1 };
    }
    if (operands.length > 1) {
      return { stdout: '', stderr: 'ping: too many hosts\n', exitCode: 1 };
    }

    const host = operands[0];
    const hostError = this.validateHost(host);
    if (hostError) {
      return { stdout: '', stderr: `ping: ${hostError}\n`, exitCode: 1 };
    }

    let i = 0;
    while (i < args.length) {
      const token = args[i];
      if (!token.startsWith('-')) {
        i++;
        continue;
      }
      const opt = token.split('=')[0];
      if (!PING_KNOWN_OPTIONS.has(opt)) {
        return { stdout: '', stderr: `ping: invalid option -- ${opt.slice(1)}\n`, exitCode: 1 };
      }
      if (PING_OPTIONS_WITH_ARG.has(opt)) {
        let value: string;
        if (token.includes('=')) {
          value = token.slice(opt.length + 1);
        } else {
          i++;
          if (i >= args.length) {
            return { stdout: '', stderr: `ping: option requires an argument -- ${opt.slice(1)}\n`, exitCode: 1 };
          }
          value = args[i];
        }
        const numError = this.validatePositiveInteger(value, opt);
        if (numError) {
          return { stdout: '', stderr: `ping: ${numError}\n`, exitCode: 1 };
        }
      }
      i++;
    }

    return null;
  }

  private validateHost(host: string): string | null {
    if (!host || host.length === 0) return 'missing host';
    if (host.length > 253) return 'hostname too long';
    // Allow hostname (letters, digits, hyphen, dot) or IPv4/IPv6-ish
    const hostnamePart = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/;
    const ipv4 = /^\d{1,3}(\.\d{1,3}){3}$/;
    if (hostnamePart.test(host) || ipv4.test(host)) return null;
    if (host.startsWith('[') && host.endsWith(']')) {
      const inner = host.slice(1, -1);
      if (inner.includes(':') && inner.length <= 39) return null;
    }
    return 'invalid host';
  }

  private validatePositiveInteger(value: string, opt: string): string | null {
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || String(n) !== value.trim() || n < 1) {
      return `invalid argument '${value}' for '${opt}'`;
    }
    if ((opt === '-c' || opt === '--count') && n > 1000) return "count too large (max 1000)";
    return null;
  }
}

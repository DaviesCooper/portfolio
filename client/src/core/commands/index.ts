import { CommandRegistry } from './CommandRegistry';
import { PsCommand } from './commands/ps';
import { FindCommand } from './commands/find';
import { UnameCommand } from './commands/uname';
import { LsCommand } from './commands/ls';
import { CdCommand } from './commands/cd';
import { PwdCommand } from './commands/pwd';
import { CatCommand } from './commands/cat';
import { PingCommand } from './commands/ping';
import { ClearCommand } from './commands/clear';
import { HelpCommand } from './commands/help';
import { OpenCommand } from './commands/open';
import { WhoamiCommand } from './commands/whoami';
import { DateCommand } from './commands/date';
import { EchoCommand } from './commands/echo';
import { GrepCommand } from './commands/grep';
import { SshCommand } from './commands/ssh';
import { RmCommand } from './commands/rm';
import { CpCommand } from './commands/cp';
import { MvCommand } from './commands/mv';
import { MkdirCommand } from './commands/mkdir';
import { TouchCommand } from './commands/touch';
import { EditCommand } from './commands/edit';

export function createCommandRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  registry
    .register(new PsCommand())
    .register(new FindCommand())
    .register(new UnameCommand())
    .register(new LsCommand())
    .register(new CdCommand())
    .register(new PwdCommand())
    .register(new CatCommand())
    .register(new PingCommand())
    .register(new ClearCommand())
    .register(new HelpCommand(registry))
    .register(new OpenCommand())
    .register(new WhoamiCommand())
    .register(new DateCommand())
    .register(new EchoCommand())
    .register(new GrepCommand())
    .register(new SshCommand())
    .register(new RmCommand())
    .register(new CpCommand())
    .register(new MvCommand())
    .register(new MkdirCommand())
    .register(new TouchCommand())
    .register(new EditCommand());
  return registry;
}

export { CommandRegistry } from './CommandRegistry';
export type { ICommand } from '../types/command';

import type { ICommand, CommandContext, CommandResult } from '../../types/command';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** Format d using Unix date-style % specifiers. Supports common placeholders. */
function formatDate(d: Date, fmt: string): string {
  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const day = d.getDay();

  return fmt.replace(/%([a-zA-Z%])/g, (_, spec: string) => {
    switch (spec) {
      case '%':
        return '%';
      case 'Y':
        return String(year);
      case 'm':
        return pad2(month + 1);
      case 'd':
        return pad2(date);
      case 'H':
        return pad2(hours);
      case 'M':
        return pad2(minutes);
      case 'S':
        return pad2(seconds);
      case 'a':
        return WEEKDAYS[day];
      case 'b':
      case 'h':
        return MONTHS[month];
      case 'A':
        return WEEKDAYS[day] + 'day';
      case 'B':
        return FULL_MONTHS[month];
      default:
        return '%' + spec;
    }
  });
}

/** Default format: "Sun Feb 22 12:34:56 UTC 2026" */
function defaultDateString(d: Date): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${tz} ${d.getFullYear()}`;
}

/**
 * date — Print current date/time. Optional format: date "+%Y-%m-%d %H:%M:%S"
 */
export class DateCommand implements ICommand {
  readonly name = 'date';
  readonly description = 'Print system date and time';

  execute(args: string[], _context: CommandContext): CommandResult {
    const now = new Date();
    if (args.length === 0) {
      return { stdout: defaultDateString(now) + '\n', stderr: '', exitCode: 0 };
    }
    if (args[0] === '+' && args.length >= 2) {
      const fmt = args.slice(1).join(' ');
      return { stdout: formatDate(now, fmt) + '\n', stderr: '', exitCode: 0 };
    }
    if (args[0].startsWith('+')) {
      return { stdout: formatDate(now, args[0].slice(1)) + '\n', stderr: '', exitCode: 0 };
    }
    return { stdout: defaultDateString(now) + '\n', stderr: '', exitCode: 0 };
  }
}

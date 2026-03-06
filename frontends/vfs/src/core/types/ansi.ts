/**
 * ANSI SGR (Select Graphic Rendition) escape sequences for terminal output.
 * Commands use the ANSI_* string constants in stdout; TerminalWindow parses
 * them and maps SGR codes to CSS classes. Import these wherever you need to
 * emit colored text (e.g. ls for directory names).
 */

export const ANSI_RESET = '\x1b[0m';

export const ANSI_GREEN = '\x1b[32m';
export const ANSI_RED = '\x1b[31m';
export const ANSI_YELLOW = '\x1b[33m';
export const ANSI_BLUE = '\x1b[34m';
export const ANSI_MAGENTA = '\x1b[35m';
export const ANSI_CYAN = '\x1b[36m';

/** SGR code numbers; used by TerminalWindow to map escape codes to CSS classes. */
export const SGR_RESET = 0;
export const SGR_GREEN = 32;
export const SGR_RED = 31;
export const SGR_YELLOW = 33;
export const SGR_BLUE = 34;
export const SGR_MAGENTA = 35;
export const SGR_CYAN = 36;

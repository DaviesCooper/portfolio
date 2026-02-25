/** Characters not allowed in filenames or directory names (Unix/shell). */
export const RESERVED_FILENAME_CHARS = new Set([
    '/',   // path separator (Unix)
    '\\',  // path separator (Windows), escape in shells
    ':',   // drive/path delimiter (Windows), used in URLs
    '*',   // glob wildcard
    '?',   // glob wildcard
    '"',   // shell quoting
    '<',   // stdin redirection
    '>',   // stdout redirection
    '|',   // pipe
    '\0',  // null (string terminator)
    '\n',  // newline
    '\r',  // carriage return
    '\t',  // tab
]);

/** Reserved names: . and .. (current/parent directory). */
export const RESERVED_FILENAMES = new Set(['.', '..']);

export function isValidFilename(name: string | undefined): string {
    console.log(name);
    if (name === undefined || name === null) throw new Error('Invalid filename: undefined or null');
    if (!name || name.length === 0) throw new Error('Invalid filename: empty string');
    if (RESERVED_FILENAMES.has(name)) throw new Error('Invalid filename: reserved name');
    for (let i = 0; i < name.length; i++) {
        if (RESERVED_FILENAME_CHARS.has(name[i])) throw new Error('Invalid filename: reserved character');
    }
    return name;
}
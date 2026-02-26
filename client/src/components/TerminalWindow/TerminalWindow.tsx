import React, { useState, useRef, useEffect } from 'react';
import type { CommandRegistry } from '../../core/commands/CommandRegistry';
import type { IVirtualFilesystem } from '../../core/types/filesystem';
import type { IWindowHost } from '../../core/types/window';
import { ShellSession } from '../../core/shell/ShellSession';
import { SGR_GREEN, SGR_RED, SGR_YELLOW, SGR_BLUE, SGR_MAGENTA, SGR_CYAN, ANSI_RESET, ANSI_BLUE, ANSI_RED } from '../../core/types/ansi';
import styles from './TerminalWindow.module.css';

const HOME = '/home/cooper';

/**
 * Expand leading ~ or ~/ in a path to HOME.
 */
function expandTilde(path: string): string {
  if (path === '~') return HOME;
  if (path.startsWith('~/')) return HOME + path.slice(1);
  return path;
}

/**
 * Tab-complete a path fragment relative to cwd using the virtual fs.
 * Returns the replacement string for the fragment, or null if no completion.
 */
function completePath(
  fragment: string,
  cwd: string,
  fs: IVirtualFilesystem
): { replacement: string; multiple: boolean } | null {
  if (!fragment.length) return null;
  const expanded = expandTilde(fragment);
  const lastSlash = expanded.lastIndexOf('/');
  const dirPart = lastSlash >= 0 ? expanded.slice(0, lastSlash + 1) : '';
  const prefix = lastSlash >= 0 ? expanded.slice(lastSlash + 1) : expanded;

  const resolvedDir = dirPart === '' ? cwd : fs.resolve(dirPart, cwd);
  if (!fs.isDirectory(resolvedDir)) return null;
  const entries = fs.readDir(resolvedDir);
  if (!entries) return null;

  const matches = entries.filter((e) => e.name.startsWith(prefix));
  if (matches.length === 0) return null;
  if (matches.length === 1) {
    const node = matches[0];
    const suffix = node.kind === 'directory' ? '/' : '';
    const replacement = dirPart + node.name + suffix;
    return { replacement, multiple: false };
  }
  const common = commonPrefix(matches.map((e) => e.name));
  return { replacement: dirPart + common, multiple: true };
}

function commonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let i = 0;
  const first = strings[0];
  while (i < first.length && strings.every((s) => s[i] === first[i])) i++;
  return first.slice(0, i);
}

// Match ANSI SGR sequences: ESC [ <codes> m (e.g. ESC [ 32 m for green, ESC [ 0 m for reset)
const ANSI_CSI_REGEX = /\x1b\[([0-9;]*)m/g;

/** Map SGR foreground codes to CSS module class names (see TerminalWindow.module.css). */
const SGR_TO_CLASS: Record<number, string> = {
  [SGR_GREEN]: styles.ansiGreen,
  [SGR_RED]: styles.ansiRed,
  [SGR_YELLOW]: styles.ansiYellow,
  [SGR_BLUE]: styles.ansiBlue,
  [SGR_MAGENTA]: styles.ansiMagenta,
  [SGR_CYAN]: styles.ansiCyan,
};

/**
 * Parse a line that may contain ANSI SGR codes and return React nodes.
 * Uses SGR_TO_CLASS so colors match core/ansi.ts (e.g. ls directory names in green).
 */
function renderLineWithAnsi(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let currentClass: string | null = null;
  const re = new RegExp(ANSI_CSI_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(line)) !== null) {
    const raw = match[0];
    const codes = match[1];
    const text = line.slice(lastIndex, match.index);

    if (text.length > 0) {
      if (currentClass !== null) {
        parts.push(<span key={match.index} className={currentClass}>{text}</span>);
      } else {
        parts.push(text);
      }
    }

    lastIndex = match.index + raw.length;

    if (codes === '0' || codes === '') {
      currentClass = null;
    } else {
      const code = parseInt(codes, 10);
      if (Number.isNaN(code) === false && SGR_TO_CLASS[code] !== undefined) {
        currentClass = SGR_TO_CLASS[code];
      }
    }
  }

  const tail = line.slice(lastIndex);
  if (tail.length > 0) {
    if (currentClass !== null) {
      parts.push(<span key="tail" className={currentClass}>{tail}</span>);
    } else {
      parts.push(tail);
    }
  }

  if (parts.length === 1) {
    return parts[0];
  }
  return <>{parts}</>;
}

/** Match markdown-style links [text](url) for clickable links in output. */
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;

/**
 * Render a line that may contain ANSI codes and markdown links [text](url).
 * Links are rendered as actual <a> elements so they are clickable.
 */
function renderLineWithAnsiAndLinks(line: string): React.ReactNode {
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(MARKDOWN_LINK_REGEX.source, 'g');

  while ((match = re.exec(line)) !== null) {
    const [full, linkText, url] = match;
    const before = line.slice(lastIndex, match.index);
    if (before.length > 0) {
      segments.push(renderLineWithAnsi(before));
    }
    segments.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.outputLink}
        onClick={(e) => e.stopPropagation()}
      >
        {linkText}
      </a>
    );
    lastIndex = match.index + full.length;
  }

  const tail = line.slice(lastIndex);
  if (tail.length > 0) {
    segments.push(renderLineWithAnsi(tail));
  }

  if (segments.length === 0) return null;
  if (segments.length === 1) return segments[0];
  return <>{segments}</>;
}

interface TerminalWindowProps {
  commandRegistry: CommandRegistry;
  fs: IVirtualFilesystem;
  windowHost: IWindowHost;
  openInViewer: (path: string, mimeType: string, content: ArrayBuffer | string, options?: { sourceUrl?: string }) => void;
  onVfsRootCleared?: () => void;
}

export function TerminalWindow({
  commandRegistry,
  fs,
  windowHost,
  openInViewer,
  onVfsRootCleared,
}: TerminalWindowProps) {
  const [outputLines, setOutputLines] = useState<string[]>(() => [
    'Hi, I\'m Cooper Davies, PhD. Thanks for stopping by, glad you\'re here!',
    'This is my personal portfolio which you can use to explore my work and learn more about me.',
    'Although this may look like a linux desktop, it is actually purely emulated.',
    'Everything is written in javascript.',
    'You can find the source code for this portfolio [here](https://github.com/DaviesCooper/portfolio).\n\n',
    'Feel free to explore and toy around with the commands. You can\'t actually break anything so',
    'don\'t worry about it. For example, see what happens if you "rm -rf /"\n\n',
    'Type help to see a list of commands.\n\n',
  ]);
  const [inputValue, setInputValue] = useState('');
  const [cwd, setCwd] = useState('/home/cooper');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<ShellSession | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const editingLineRef = useRef('');
  const [selectionAfterTab, setSelectionAfterTab] = useState<{ start: number; end: number } | null>(null);

  if (!sessionRef.current) {
    sessionRef.current = new ShellSession(commandRegistry);
  }
  const session = sessionRef.current;

  const promptParts = (() => {
    let path: string;
    if (cwd === '/') path = '/';
    else if (cwd === '/home/cooper') path = '~';
    else path = cwd.split('/').pop() ?? cwd;
    return { user: 'guest@wildroseplains', path, end: '$ ' };
  })();

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [outputLines, inputValue]);

  useEffect(() => {
    if (selectionAfterTab && inputRef.current) {
      inputRef.current.setSelectionRange(selectionAfterTab.start, selectionAfterTab.end);
      inputRef.current.focus();
      setSelectionAfterTab(null);
    }
  }, [selectionAfterTab, inputValue]);

  const handleSubmit = async () => {
    const line = inputValue.trim();
    const fullLine = `${ANSI_BLUE}${promptParts.user}:${promptParts.path}${ANSI_RESET}$ ${inputValue}`;
    setInputValue('');

    setOutputLines((prev) => [...prev, fullLine]);

    if (line === 'clear') {
      setOutputLines([]);
      return;
    }

    if (!line) return;

    if (historyRef.current[historyRef.current.length - 1] !== line) {
      historyRef.current = [...historyRef.current, line];
    }
    historyIndexRef.current = null;

    try {
      const result = await session.run(line, {
        fs,
        openInViewer,
        windowHost,
        onVfsRootCleared,
      });
      if (result.setCwd) setCwd(result.setCwd);
      const out = (result.stdout + (result.stderr ? `${ANSI_RED}${result.exitCode !== 0 ? 'Error: ' : ''}${result.stderr}${ANSI_RESET}` : '')).trim();
      if (out) {
        const lines = out.split('\n');
        setOutputLines((prev) => [...prev, ...lines]);
      }
    } catch (e) {
      setOutputLines((prev) => [...prev, (e as Error).message]);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value;
      const cursor = input.selectionStart ?? value.length;
      const spaceBefore = value.lastIndexOf(' ', cursor - 1);
      const start = spaceBefore === -1 ? 0 : spaceBefore + 1;
      const fragment = value.slice(start, cursor);
      const result = completePath(fragment, cwd, fs);
      if (result) {
        const newValue = value.slice(0, start) + result.replacement + value.slice(cursor);
        setInputValue(newValue);
        setSelectionAfterTab({ start: start + result.replacement.length, end: start + result.replacement.length });
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = historyRef.current;
      if (history.length === 0) return;
      if (historyIndexRef.current === null) {
        editingLineRef.current = inputValue;
        historyIndexRef.current = history.length - 1;
      } else if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
      } else {
        return;
      }
      setInputValue(history[historyIndexRef.current]);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndexRef.current === null) return;
      const history = historyRef.current;
      historyIndexRef.current += 1;
      if (historyIndexRef.current >= history.length) {
        historyIndexRef.current = null;
        setInputValue(editingLineRef.current);
      } else {
        setInputValue(history[historyIndexRef.current]);
      }
    }
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <div className={styles.terminal} onClick={focusInput}>
      <div ref={scrollRef} className={styles.output}>
        {outputLines.map((line, i) => (
          <div key={i} className={styles.line}>
            {renderLineWithAnsiAndLinks(line)}
          </div>
        ))}
      </div>
      <div className={styles.inputRow}>
        <span className={styles.prompt}>
          <span className={styles.promptUser}>{promptParts.user}:</span>
          <span className={styles.promptPath}>{promptParts.path}</span>
          <span className={styles.promptEnd}>{promptParts.end}</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
        />
      </div>
    </div>
  );
}

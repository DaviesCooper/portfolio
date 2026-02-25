import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { IVirtualFilesystem } from '../../core/types/filesystem';
import type { WindowPayload } from '../../core/types/window';
import styles from './EditorWindow.module.css';

/** Keep only ASCII (0x00–0x7F). */
function toAsciiOnly(s: string): string {
  return s.replace(/[\x80-\uFFFF]/g, '');
}

export interface EditorWindowProps {
  payload: WindowPayload;
  fs: IVirtualFilesystem;
}

export function EditorWindow({ payload, fs }: EditorWindowProps) {
  const filePath = payload.filePath ?? '';
  const filename = payload.filename ?? 'untitled';
  const [content, setContent] = useState(() => toAsciiOnly(payload.text ?? ''));
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyAscii = useCallback((next: string) => {
    setContent(toAsciiOnly(next));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      applyAscii(e.target.value);
    },
    [applyAscii]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text/plain');
      const ascii = toAsciiOnly(pasted);
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = content.slice(0, start);
      const after = content.slice(end);
      applyAscii(before + ascii + after);
      setTimeout(() => {
        const newPos = start + ascii.length;
        ta.setSelectionRange(newPos, newPos);
        ta.focus();
      }, 0);
    },
    [content, applyAscii]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key.length === 1 && e.key.charCodeAt(0) > 127) {
        e.preventDefault();
      }
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!filePath) {
      setSaveError('No file path');
      setSaveStatus('error');
      return;
    }
    setSaveStatus('saving');
    setSaveError(null);
    try {
      // Always save as raw text only (no HTML, rich text, or encoding transforms).
      fs.writeFileUtf8(filePath, content);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveError((err as Error).message);
      setSaveStatus('error');
    }
  }, [filePath, content, fs]);

  const findNext = useCallback(() => {
    if (!searchTerm) return;
    const idx = content.toLowerCase().indexOf(searchTerm.toLowerCase(), searchIndex);
    if (idx === -1) {
      const wrap = content.toLowerCase().indexOf(searchTerm.toLowerCase(), 0);
      if (wrap === -1) return;
      setSearchIndex(wrap + 1);
      scrollToIndex(wrap);
    } else {
      setSearchIndex(idx + 1);
      scrollToIndex(idx);
    }
  }, [content, searchTerm, searchIndex]);

  const scrollToIndex = (index: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(index, index + searchTerm.length);
    const line = content.slice(0, index).split('\n').length;
    const lineHeight = 22;
    const visibleLines = Math.floor(ta.clientHeight / lineHeight);
    ta.scrollTop = Math.max(0, (line - Math.floor(visibleLines / 2)) * lineHeight);
  };

  const replaceOne = useCallback(() => {
    if (!searchTerm) return;
    let idx = content.toLowerCase().indexOf(searchTerm.toLowerCase(), searchIndex);
    if (idx === -1) idx = content.toLowerCase().indexOf(searchTerm.toLowerCase(), 0);
    if (idx === -1) return;
    const before = content.slice(0, idx);
    const after = content.slice(idx + searchTerm.length);
    const next = before + replaceTerm + after;
    applyAscii(next);
    setSearchIndex(idx + replaceTerm.length);
  }, [content, searchTerm, replaceTerm, searchIndex, applyAscii]);

  const replaceAll = useCallback(() => {
    if (!searchTerm) return;
    const re = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const next = content.replace(re, replaceTerm);
    applyAscii(next);
    setSearchIndex(0);
  }, [content, searchTerm, replaceTerm, applyAscii]);

  const toggleCommentSelection = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lines = content.split('\n');
    let lineStart = 0;
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineEnd = lineStart + lines[i].length + (i < lines.length - 1 ? 1 : 0);
      if (start < lineEnd) {
        lineIndex = i;
        break;
      }
      lineStart = lineEnd;
    }
    let lastLineIndex = lineIndex;
    let lineEnd = lineStart;
    for (let i = lineIndex; i < lines.length; i++) {
      lineEnd = lineEnd + lines[i].length + (i < lines.length - 1 ? 1 : 0);
      if (end <= lineEnd) {
        lastLineIndex = i;
        break;
      }
      lastLineIndex = i;
    }
    const prefix = '# ';
    const selectedLines = lines.slice(lineIndex, lastLineIndex + 1);
    const allHavePrefix = selectedLines.every((l) => l.startsWith(prefix));
    const newLines = selectedLines.map((l) =>
      allHavePrefix ? (l.startsWith(prefix) ? l.slice(prefix.length) : l) : prefix + l
    );
    const before = lines.slice(0, lineIndex).join('\n');
    const mid = newLines.join('\n');
    const after = lines.slice(lastLineIndex + 1).join('\n');
    const next = [before, mid, after].filter(Boolean).join('\n');
    applyAscii(next);
  }, [content, applyAscii]);

  const cycleSort = useCallback(() => {
    const lines = content.split('\n').filter((l) => l.length > 0 || content.includes('\n'));
    if (lines.length <= 1) return;
    const sorted = [...lines].sort((a, b) => (sortAscending ? a.localeCompare(b) : b.localeCompare(a)));
    applyAscii(sorted.join('\n'));
    setSortAscending((prev) => !prev);
  }, [content, sortAscending, applyAscii]);

  useEffect(() => {
    setSearchIndex(0);
  }, [searchTerm, content]);

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave}>
            Save
          </button>
          <span
            className={`${styles.saveStatus} ${
              saveStatus === 'saved' ? styles.saved : saveStatus === 'error' ? styles.error : ''
            }`}
          >
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && (saveError ?? 'Error')}
          </span>
        </div>
        <div className={styles.toolbarGroup}>
          <button type="button" className={styles.btn} onClick={toggleCommentSelection} title="Comment or uncomment selection (# )">
            Comment / Uncomment
          </button>
        </div>
        <div className={styles.toolbarGroup}>
          <button type="button" className={styles.btn} onClick={cycleSort} title={sortAscending ? 'Sort A–Z (next click: Z–A)' : 'Sort Z–A (next click: A–Z)'}>
            Sort {sortAscending ? 'A→Z' : 'Z→A'}
          </button>
        </div>
        <div className={styles.searchReplace}>
            <label>
              Find
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(toAsciiOnly(e.target.value))}
                placeholder="Find"
                aria-label="Find"
              />
            </label>
            <label>
              Replace
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(toAsciiOnly(e.target.value))}
                placeholder="Replace"
                aria-label="Replace"
              />
            </label>
            <button type="button" className={styles.btn} onClick={findNext}>
              Find Next
            </button>
            <button type="button" className={styles.btn} onClick={replaceOne}>
              Replace
            </button>
            <button type="button" className={styles.btn} onClick={replaceAll}>
              Replace All
            </button>
          </div>
      </div>
      <div className={styles.textareaWrap}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={content}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="ASCII only. Paste or type…"
          spellCheck={false}
          aria-label={`Edit ${filename}`}
        />
      </div>
    </div>
  );
}

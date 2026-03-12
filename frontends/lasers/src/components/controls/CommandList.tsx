import React, { useCallback, useRef, useState } from 'react';
import type { Command } from '../../lib/command';
import './CommandList.css';

const ALLOWED_COMMANDS: ReadonlyArray<{ type: Command['type']; label: string }> = [
  { type: 'on', label: 'Laser On' },
  { type: 'off', label: 'Laser Off' },
  { type: 'goto', label: 'Go To' },
];

export interface CommandListProps {
  /** Current list of commands (controlled). */
  value?: Command[];
  /** Initial list when uncontrolled. */
  defaultValue?: Command[];
  /** Called when the command list changes. */
  onChange?: (commands: Command[]) => void;
  /** Optional aria-label for the list. */
  'aria-label'?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Compute the Y position (in list content coordinates) for the drop line at insertIndex. Same gap = same position. */
function getDropLineTopPx(
  list: HTMLUListElement | null,
  insertIndex: number,
  itemCount: number
): number {
  if (!list || itemCount === 0) return 0;
  if (insertIndex === 0) return 0;
  if (insertIndex >= itemCount) {
    const last = list.children[itemCount - 1] as HTMLElement | undefined;
    if (!last) return 0;
    const listRect = list.getBoundingClientRect();
    return last.getBoundingClientRect().bottom - listRect.top + list.scrollTop;
  }
  const child = list.children[insertIndex] as HTMLElement | undefined;
  if (!child) return 0;
  const listRect = list.getBoundingClientRect();
  return child.getBoundingClientRect().top - listRect.top + list.scrollTop;
}

/** Compute insertion index from cursor Y when we're over the list but not necessarily over a list item (e.g. padding, gaps). */
function getInsertIndexFromClientY(
  list: HTMLUListElement | null,
  clientY: number,
  itemCount: number
): number {
  if (!list || itemCount === 0) return 0;
  for (let i = 0; i < itemCount; i++) {
    const child = list.children[i] as HTMLElement | undefined;
    if (!child) continue;
    const rect = child.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (clientY < mid) return i;
  }
  return itemCount;
}

export function CommandList(props: CommandListProps): JSX.Element {
  const { value: controlledValue, defaultValue = [], onChange, 'aria-label': ariaLabel } = props;
  const [uncontrolledValue, setUncontrolledValue] = useState<Command[]>(() => defaultValue ?? []);
  const [dropIndicator, setDropIndicator] = useState<{ index: number; topPx: number } | null>(null);
  /** When set, the user is editing this goto field; value is the raw string (allows empty for backspace). */
  const [editingGoto, setEditingGoto] = useState<{
    index: number;
    field: 'x' | 'y';
    value: string;
  } | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Ref mirror of insertion index so drop handler uses the last drag-over position, not the drop target element. */
  const dropIndexRef = useRef<number | null>(null);
  const isControlled = controlledValue !== undefined;
  const commands = isControlled ? controlledValue : uncontrolledValue;

  const setCommands = useCallback(
    (next: Command[] | ((prev: Command[]) => Command[])) => {
      const resolved = typeof next === 'function' ? next(commands) : next;
      if (!isControlled) setUncontrolledValue(resolved);
      onChange?.(resolved);
    },
    [commands, isControlled, onChange]
  );

  const handleDragStartPalette = useCallback((e: React.DragEvent, type: Command['type']) => {
    e.dataTransfer.setData('application/x-command-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', type);
  }, []);

  const handleDragStartItem = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('application/x-command-index', String(index));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDropZoneDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-command-type')
        ? 'copy'
        : 'move';
      const target = e.target as HTMLElement;
      if (!target.closest('.command-list-item')) {
        const list = listRef.current;
        const index =
          commands.length === 0
            ? 0
            : getInsertIndexFromClientY(list, e.clientY, commands.length);
        const topPx = getDropLineTopPx(list, index, commands.length);
        dropIndexRef.current = index;
        setDropIndicator({ index, topPx });
      }
    },
    [commands.length]
  );

  const handleItemDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-command-type')
      ? 'copy'
      : 'move';
    const itemEl = e.currentTarget as HTMLElement;
    const list = listRef.current;
    const rect = itemEl.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const insertIndex = e.clientY < mid ? index : index + 1;
    const topPx = getDropLineTopPx(list, insertIndex, commands.length);
    dropIndexRef.current = insertIndex;
    setDropIndicator({ index: insertIndex, topPx });
  }, [commands.length]);

  const handleDropZoneDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!dropZoneRef.current?.contains(related)) {
      dropIndexRef.current = null;
      setDropIndicator(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const insertIndex = dropIndexRef.current ?? commands.length;
      dropIndexRef.current = null;
      setDropIndicator(null);

      const type = e.dataTransfer.getData('application/x-command-type');
      const fromIndexRaw = e.dataTransfer.getData('application/x-command-index');

      if (type) {
        const newCmd: Command =
          type === 'goto' ? { type: 'goto', x: 0, y: 0 } : { type: type as 'on' | 'off' };
        setCommands((prev) => {
          const out = [...prev];
          out.splice(insertIndex, 0, newCmd);
          return out;
        });
        return;
      }

      if (fromIndexRaw !== '') {
        const fromIndex = Number(fromIndexRaw);
        if (Number.isNaN(fromIndex) || fromIndex < 0 || fromIndex >= commands.length) return;
        setCommands((prev) => {
          const out = [...prev];
          const [removed] = out.splice(fromIndex, 1);
          const insertAt = fromIndex < insertIndex ? insertIndex - 1 : insertIndex;
          out.splice(insertAt, 0, removed);
          return out;
        });
      }
    },
    [commands.length, setCommands]
  );

  const removeAt = useCallback(
    (index: number) => {
      setCommands((prev) => prev.filter((_, i) => i !== index));
    },
    [setCommands]
  );

  const updateCommand = useCallback(
    (index: number, patch: Partial<Command>) => {
      setCommands((prev) => {
        const out = [...prev];
        out[index] = { ...out[index], ...patch };
        return out;
      });
    },
    [setCommands]
  );

  const updateGotoCoords = useCallback(
    (index: number, x?: number, y?: number) => {
      const cmd = commands[index];
      if (cmd?.type !== 'goto') return;
      const nextX = x !== undefined ? clamp(x, 0, 100) : cmd.x ?? 0;
      const nextY = y !== undefined ? clamp(y, 0, 100) : cmd.y ?? 0;
      updateCommand(index, { x: nextX, y: nextY });
    },
    [commands, updateCommand]
  );

  const commitGotoEdit = useCallback(
    (index: number, field: 'x' | 'y', raw: string) => {
      const num = clamp(parseInt(raw, 10) || 0, 0, 100);
      if (field === 'x') updateGotoCoords(index, num, undefined);
      else updateGotoCoords(index, undefined, num);
      setEditingGoto(null);
    },
    [updateGotoCoords]
  );

  return (
    <div className="command-list" role="group" aria-label={ariaLabel ?? 'Command list'}>
      <div className="command-list-palette" aria-label="Available commands">
        {ALLOWED_COMMANDS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            className="command-list-palette-item"
            draggable
            onDragStart={(e) => handleDragStartPalette(e, type)}
            aria-label={`Add ${label}; drag into list`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={dropZoneRef}
        className="command-list-drop-zone"
        onDragOver={handleDropZoneDragOver}
        onDragLeave={handleDropZoneDragLeave}
        onDrop={handleDrop}
        aria-label="Drop here to append"
      >
        <ul ref={listRef} className="command-list-list" aria-label="Ordered commands">
          {commands.length === 0 ? (
            <li className="command-list-empty" aria-hidden onDragOver={handleDropZoneDragOver}>
              Drag commands here
            </li>
          ) : (
            commands.map((cmd, index) => (
              <li
                key={index}
                className="command-list-item"
                draggable
                onDragStart={(e) => handleDragStartItem(e, index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop(e);
                }}
              >
                <span className="command-list-item-handle" aria-hidden title="Drag to reorder">
                  ⋮⋮
                </span>
                {cmd.type === 'goto' ? (
                  <span className="command-list-item-body command-list-item-goto">
                    <span className="command-list-goto-prefix">X:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={
                        editingGoto?.index === index && editingGoto?.field === 'x'
                          ? editingGoto.value
                          : String(cmd.x ?? 0)
                      }
                      onFocus={() =>
                        setEditingGoto({ index, field: 'x', value: String(cmd.x ?? 0) })
                      }
                      onChange={(e) => {
                        if (editingGoto?.index === index && editingGoto?.field === 'x') {
                          setEditingGoto({ ...editingGoto, value: e.target.value });
                        }
                      }}
                      onBlur={(e) => {
                        if (editingGoto?.index === index && editingGoto?.field === 'x') {
                          commitGotoEdit(index, 'x', e.target.value);
                        }
                      }}
                      className="command-list-goto-input"
                      aria-label="X (0–100)"
                    />
                    <span className="command-list-goto-prefix">Y:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={
                        editingGoto?.index === index && editingGoto?.field === 'y'
                          ? editingGoto.value
                          : String(cmd.y ?? 0)
                      }
                      onFocus={() =>
                        setEditingGoto({ index, field: 'y', value: String(cmd.y ?? 0) })
                      }
                      onChange={(e) => {
                        if (editingGoto?.index === index && editingGoto?.field === 'y') {
                          setEditingGoto({ ...editingGoto, value: e.target.value });
                        }
                      }}
                      onBlur={(e) => {
                        if (editingGoto?.index === index && editingGoto?.field === 'y') {
                          commitGotoEdit(index, 'y', e.target.value);
                        }
                      }}
                      className="command-list-goto-input"
                      aria-label="Y (0–100)"
                    />
                  </span>
                ) : (
                  <span className="command-list-item-body command-list-item-label">
                    {cmd.type === 'on' ? 'On' : 'Off'}
                  </span>
                )}
                <button
                  type="button"
                  className="command-list-remove"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove command ${index + 1}`}
                >
                  ×
                </button>
              </li>
            ))
          )}
        </ul>
        {dropIndicator !== null && (() => {
          const list = listRef.current;
          const topPx =
            list != null
              ? list.offsetTop + dropIndicator.topPx - list.scrollTop
              : dropIndicator.topPx;
          return (
            <div
              className="command-list-drop-indicator"
              aria-hidden
              style={{ top: topPx }}
            />
          );
        })()}
      </div>
    </div>
  );
}

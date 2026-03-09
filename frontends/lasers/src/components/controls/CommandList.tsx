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

export function CommandList(props: CommandListProps): JSX.Element {
  const { value: controlledValue, defaultValue = [], onChange, 'aria-label': ariaLabel } = props;
  const [uncontrolledValue, setUncontrolledValue] = useState<Command[]>(() => defaultValue ?? []);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
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
        setDropIndicatorIndex(commands.length === 0 ? 0 : commands.length);
      }
    },
    [commands.length]
  );

  const handleItemDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-command-type')
      ? 'copy'
      : 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    setDropIndicatorIndex(e.clientY < mid ? index : index + 1);
  }, []);

  const handleDropZoneDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!dropZoneRef.current?.contains(related)) {
      setDropIndicatorIndex(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      setDropIndicatorIndex(null);
      const type = e.dataTransfer.getData('application/x-command-type');
      const fromIndexRaw = e.dataTransfer.getData('application/x-command-index');

      if (type) {
        const newCmd: Command =
          type === 'goto' ? { type: 'goto', x: 0, y: 0 } : { type: type as 'on' | 'off' };
        setCommands((prev) => {
          const out = [...prev];
          out.splice(dropIndex, 0, newCmd);
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
          const insertAt = fromIndex < dropIndex ? dropIndex - 1 : dropIndex;
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
        onDrop={(e) => handleDrop(e, commands.length)}
        aria-label="Drop here to append"
      >
        <ul className="command-list-list" aria-label="Ordered commands">
          {commands.length === 0 ? (
            <>
              {dropIndicatorIndex === 0 && (
                <li className="command-list-drop-indicator" aria-hidden />
              )}
              <li className="command-list-empty" aria-hidden onDragOver={handleDropZoneDragOver}>
                Drag commands here
              </li>
            </>
          ) : (
            commands.map((cmd, index) => (
              <React.Fragment key={`${cmd.type}-${index}-${cmd.x ?? ''}-${cmd.y ?? ''}`}>
                {dropIndicatorIndex === index && (
                  <li className="command-list-drop-indicator" aria-hidden />
                )}
                <li
                  className="command-list-item"
                  draggable
                  onDragStart={(e) => handleDragStartItem(e, index)}
                  onDragOver={(e) => handleItemDragOver(e, index)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDrop(e, index);
                  }}
                >
                <span className="command-list-item-index" aria-hidden>
                  {index + 1}.
                </span>
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
                      value={cmd.x ?? 0}
                      onChange={(e) =>
                        updateGotoCoords(index, clamp(Number(e.target.value) || 0, 0, 100), undefined)
                      }
                      className="command-list-goto-input"
                      aria-label="X (0–100)"
                    />
                    <span className="command-list-goto-prefix">Y:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cmd.y ?? 0}
                      onChange={(e) =>
                        updateGotoCoords(index, undefined, clamp(Number(e.target.value) || 0, 0, 100))
                      }
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
              </React.Fragment>
            ))
          )}
          {commands.length > 0 && dropIndicatorIndex === commands.length && (
            <li className="command-list-drop-indicator" aria-hidden />
          )}
        </ul>
      </div>
    </div>
  );
}

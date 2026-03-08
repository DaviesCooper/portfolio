import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addBurnHeatAlongLine,
  BURN_CANVAS_SIZE,
  BURN_COORD_MAX,
  BURN_HEAT_PER_POINT,
  createBurnHeatGrid,
  drawBurnCanvas,
} from '../lib/burnCanvas';
import './GCodePathSimulation.css';

export type GCodeCommand =
  | { type: 'G0'; x: number; y: number }
  | { type: 'G1'; x: number; y: number }
  | { type: 'M3' }
  | { type: 'M5' };

function commandLabel(cmd: GCodeCommand): string {
  switch (cmd.type) {
    case 'G0':
      return `Go to (${cmd.x}, ${cmd.y})`;
    case 'G1':
      return `Go to (${cmd.x}, ${cmd.y})`;
    case 'M3':
      return 'On';
    case 'M5':
      return 'Off';
  }
}

const PALETTE_COMMANDS: GCodeCommand[] = [
  { type: 'G1', x: 0, y: 0 },
  { type: 'M3' },
  { type: 'M5' },
];

export type GCodePathSimulationProps = {
  /** When set, use this program instead of editable state and hide command list/palette. */
  fixedProgram?: GCodeCommand[];
  /** When true, hide palette and program list (e.g. for raster demo). */
  hideControls?: boolean;
  /** Label under canvas when hideControls (e.g. "Play to see raster path"). */
  label?: string;
  /** Milliseconds per path segment during Play. Default 450; use lower (e.g. 120) for long raster paths. */
  segmentDurationMs?: number;
};

export function GCodePathSimulation(props: GCodePathSimulationProps = {}): JSX.Element {
  const { fixedProgram, hideControls = false, label, segmentDurationMs = 450 } = props;
  const [internalProgram, setInternalProgram] = useState<GCodeCommand[]>(() => [
    { type: 'G0', x: 50, y: 8 },
    { type: 'M3' },
    { type: 'G1', x: 61, y: 35 },
    { type: 'G1', x: 90, y: 37 },
    { type: 'G1', x: 67, y: 56 },
    { type: 'G1', x: 75, y: 84 },
    { type: 'G1', x: 50, y: 68 },
    { type: 'G1', x: 25, y: 84 },
    { type: 'G1', x: 33, y: 56 },
    { type: 'G1', x: 10, y: 37 },
    { type: 'G1', x: 39, y: 35 },
    { type: 'G1', x: 50, y: 8 },
    { type: 'M5' },
  ]);
  const program = fixedProgram ?? internalProgram;
  const setProgram = useCallback(
    (action: React.SetStateAction<GCodeCommand[]>) => {
      if (fixedProgram != null) return;
      setInternalProgram(action);
    },
    [fixedProgram]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const pathDrawnRef = useRef<{ x: number; y: number }[]>([]);
  const isReorderingRef = useRef(false);
  const heatGridRef = useRef<Float32Array>(createBurnHeatGrid());
  const playStateRef = useRef<{
    path: { x: number; y: number }[];
    laserSegments: boolean[];
    totalSegments: number;
    startTime: number;
    lastBurnX: number;
    lastBurnY: number;
    lastTargetSegment: number;
  } | null>(null);
  const playCancelledRef = useRef(false);

  const drawStaticPath = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      path: { x: number; y: number }[],
      laserSegments: boolean[],
      laserHead?: { x: number; y: number }
    ) => {
      drawBurnCanvas(ctx, heatGridRef.current, path, laserSegments, {
        laserHead,
        rasterTravelPreview: false,
      });
    },
    []
  );

  const buildPathFromProgram = useCallback((): { path: { x: number; y: number }[]; laserSegments: boolean[] } => {
    const path: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    const laserSegments: boolean[] = []; // laserSegments[i] = segment from path[i-1] to path[i] is drawn
    let laserOn = false;
    for (const cmd of program) {
      switch (cmd.type) {
        case 'G0':
        case 'G1':
          path.push({ x: cmd.x, y: cmd.y });
          laserSegments.push(laserOn);
          break;
        case 'M3':
          laserOn = true;
          break;
        case 'M5':
          laserOn = false;
          break;
      }
    }
    return { path, laserSegments };
  }, [program]);

  useEffect(() => {
    if (isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { path, laserSegments } = buildPathFromProgram();
    pathDrawnRef.current = path;
    drawStaticPath(ctx, path, laserSegments);
  }, [isPlaying, program, buildPathFromProgram, drawStaticPath]);

  useEffect(() => {
    return () => {
      playCancelledRef.current = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleDragStartPalette = useCallback((e: React.DragEvent, cmd: GCodeCommand) => {
    e.dataTransfer.setData('application/json', JSON.stringify(cmd));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragStartProgram = useCallback((e: React.DragEvent, index: number) => {
    isReorderingRef.current = true;
    e.dataTransfer.setData('application/json', JSON.stringify(program[index]));
    e.dataTransfer.setData('text/plain', `program-${index}`);
    e.dataTransfer.effectAllowed = 'move';
  }, [program]);

  const handleDropProgram = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const cmd = JSON.parse(raw) as GCodeCommand;
      const fromProgram = e.dataTransfer.getData('text/plain').startsWith('program-');
      if (fromProgram) {
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain').replace('program-', ''), 10);
        if (fromIndex === dropIndex) return;
        setProgram((prev) => {
          const next = prev.slice();
          const [removed] = next.splice(fromIndex, 1);
          const insertAt = fromIndex < dropIndex ? dropIndex - 1 : dropIndex;
          next.splice(insertAt, 0, removed);
          return next;
        });
      } else {
        setProgram((prev) => {
          const next = prev.slice();
          next.splice(dropIndex, 0, cmd);
          return next;
        });
      }
    } catch {
      // ignore invalid drop
    }
  }, [program]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = isReorderingRef.current ? 'move' : 'copy';
  }, []);

  const handleDragEnd = useCallback(() => {
    isReorderingRef.current = false;
  }, []);

  const removeCommand = useCallback((index: number) => {
    setProgram((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCommandCoord = useCallback((index: number, field: 'x' | 'y', value: number) => {
    const clamped = Math.round(Math.max(0, Math.min(BURN_COORD_MAX, value)));
    setProgram((prev) => {
      const cmd = prev[index];
      if (cmd.type !== 'G0' && cmd.type !== 'G1') return prev;
      const next = prev.slice();
      next[index] = { ...cmd, [field]: clamped };
      return next;
    });
  }, []);

  const handlePlay = useCallback(() => {
    if (program.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { path, laserSegments } = buildPathFromProgram();
    const totalSegments = path.length - 1;
    if (totalSegments <= 0) return;

    cancelAnimationFrame(rafRef.current);
    playCancelledRef.current = false;
    const segmentDuration = segmentDurationMs;
    const startTime = performance.now();
    const segStart = path[0];
    playStateRef.current = {
      path,
      laserSegments,
      totalSegments,
      startTime,
      lastBurnX: segStart.x,
      lastBurnY: segStart.y,
      lastTargetSegment: -1,
    };
    setIsPlaying(true);

    const tick = (now: number) => {
      try {
        if (playCancelledRef.current) return;
        const state = playStateRef.current;
        if (!state) return;
        const { path: p, laserSegments: laser, totalSegments: total, startTime: start } = state;
        const elapsed = now - start;
        const targetSegment = Math.min(Math.floor(elapsed / segmentDuration), total);

        if (targetSegment >= total) {
          pathDrawnRef.current = p;
          drawStaticPath(ctx, p, laser);
          playStateRef.current = null;
          setIsPlaying(false);
          return;
        }

        const partialPath = p.slice(0, targetSegment + 2);
        const partialLaser = laser.slice(0, targetSegment + 1);
        const t = Math.max(0, Math.min(1, (elapsed - targetSegment * segmentDuration) / segmentDuration));
        const a = p[targetSegment];
        const b = p[targetSegment + 1];
        const current = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        partialPath[partialPath.length - 1] = current;

        if (laser[targetSegment] && Number.isFinite(current.x) && Number.isFinite(current.y)) {
          if (state.lastTargetSegment !== targetSegment) {
            state.lastBurnX = a.x;
            state.lastBurnY = a.y;
            state.lastTargetSegment = targetSegment;
          }
          addBurnHeatAlongLine(
            heatGridRef.current,
            state.lastBurnX,
            state.lastBurnY,
            current.x,
            current.y,
            BURN_HEAT_PER_POINT
          );
          state.lastBurnX = current.x;
          state.lastBurnY = current.y;
        }

        drawStaticPath(ctx, partialPath, partialLaser, current);
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        playStateRef.current = null;
        setIsPlaying(false);
      }
    };
    requestAnimationFrame(() => {
      if (playCancelledRef.current || !playStateRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    });
  }, [program, buildPathFromProgram, drawStaticPath, segmentDurationMs]);

  const handleClear = useCallback(() => {
    setProgram([]);
    setIsPlaying(false);
  }, []);

  const handleResetCanvas = useCallback(() => {
    heatGridRef.current = createBurnHeatGrid();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { path, laserSegments } = buildPathFromProgram();
    drawStaticPath(ctx, path, laserSegments);
  }, [buildPathFromProgram, drawStaticPath]);

  return (
    <div className="gcode-path-sim">
      <div className="gcode-path-sim-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="gcode-path-sim-canvas"
          width={BURN_CANVAS_SIZE}
          height={BURN_CANVAS_SIZE}
          aria-label="Laser path preview"
        />
        <p className="gcode-path-sim-label">{label ?? 'Drag commands into the list, then Play.'}</p>
        <div className="gcode-path-sim-canvas-actions">
          <button type="button" className="gcode-path-sim-reset" onClick={handleResetCanvas}>
            Reset
          </button>
          {hideControls && (
            <button
              type="button"
              className="gcode-path-sim-play"
              onClick={handlePlay}
              disabled={program.length === 0 || isPlaying}
            >
              {isPlaying ? 'Playing…' : 'Play'}
            </button>
          )}
        </div>
      </div>
      {!hideControls && (
      <div className="gcode-path-sim-controls">
        <div className="gcode-path-sim-palette">
          {PALETTE_COMMANDS.map((cmd, i) => (
            <button
              key={`${i}-${commandLabel(cmd)}`}
              type="button"
              className="gcode-path-sim-chip"
              draggable
              onDragStart={(e) => handleDragStartPalette(e, cmd)}
            >
              {commandLabel(cmd)}
            </button>
          ))}
        </div>
        <div
          className="gcode-path-sim-program"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropProgram(e, program.length)}
          aria-label="Command list"
        >
          {program.length === 0 && (
            <span className="gcode-path-sim-drop-hint">Drop commands here</span>
          )}
          {program.map((cmd, i) => (
            <div
              key={i}
              className="gcode-path-sim-program-item"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDropProgram(e, i);
              }}
            >
              <span
                className="gcode-path-sim-drag-handle"
                draggable
                onDragStart={(e) => handleDragStartProgram(e, i)}
                onDragEnd={handleDragEnd}
              >
                {(cmd.type === 'G0' || cmd.type === 'G1') && 'Go to'}
                {cmd.type === 'M3' && 'On'}
                {cmd.type === 'M5' && 'Off'}
              </span>
              {(cmd.type === 'G0' || cmd.type === 'G1') && (
                <>
                  <input
                    type="number"
                    min={0}
                    max={BURN_COORD_MAX}
                    value={cmd.x}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      if (!Number.isNaN(n)) updateCommandCoord(i, 'x', n);
                    }}
                    className="gcode-path-sim-coord"
                    aria-label={`X coordinate for row ${i + 1}`}
                  />
                  <input
                    type="number"
                    min={0}
                    max={BURN_COORD_MAX}
                    value={cmd.y}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      if (!Number.isNaN(n)) updateCommandCoord(i, 'y', n);
                    }}
                    className="gcode-path-sim-coord"
                    aria-label={`Y coordinate for row ${i + 1}`}
                  />
                </>
              )}
              <button
                type="button"
                className="gcode-path-sim-remove"
                onClick={() => removeCommand(i)}
                aria-label={`Remove ${commandLabel(cmd)}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="gcode-path-sim-actions">
          <button
            type="button"
            className="gcode-path-sim-play"
            onClick={handlePlay}
            disabled={program.length === 0 || isPlaying}
          >
            {isPlaying ? 'Playing…' : 'Play'}
          </button>
          {!hideControls && (
            <button type="button" className="gcode-path-sim-clear" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

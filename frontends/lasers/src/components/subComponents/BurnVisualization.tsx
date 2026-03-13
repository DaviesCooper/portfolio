import { useCallback, useEffect, useRef, useState } from 'react';
import './BurnVisualization.css';
import { Gradient } from '../../lib/gradient';
import { Command } from '../../lib/command';
import { BurnVariables } from '../../lib/burnVariables';
import { applyBurn, cmdToGrid, drawCommandPath, drawGrid } from '../../lib/burn';

// ---- Consts ----
const GRID_RESOLUTION = 175;
const MAX_VALUE = 1;
/** Default canvas width/height in pixels when canvasSize prop is not provided. */
const DEFAULT_CANVAS_SIZE = 512;
/** Command space is 0..BURN_COORD_MAX; we map to grid 0..GRID_RESOLUTION-1 */
const BURN_COORD_MAX = 100;
/** Default ms per command step and per segment when animationSpeedMs is not provided. */
const DEFAULT_ANIMATION_SPEED_MS = 80;
/** Substeps along the segment per frame so the trail has no gaps. */
const PLAYBACK_SUBSTEPS_PER_FRAME = 20;
/** Min/max substeps when interpolating drag segments to avoid gaps. */
const DRAG_INTERPOLATION_MIN = 2;
const DRAG_INTERPOLATION_MAX = 48;
/** Variables.radius is 0..1; scale to grid cells. */
const RADIUS_TO_GRID = GRID_RESOLUTION / 20;

export interface BurnVisualizationProps {
  /** Burn parameters. Parent controls values (e.g. from sliders). */
  variables: BurnVariables;
  /** Optional commands. When provided, a play button is shown. */
  commands?: Command[] | null;
  /** Heat → color (plus background for cut-through). */
  colorPalette: Gradient;
  /** Canvas width and height in pixels. Omit for default (desktop size); pass smaller for mobile. */
  canvasSize?: number;
}

export function BurnVisualization(props: BurnVisualizationProps): JSX.Element {
  const { variables, commands, colorPalette, canvasSize: canvasSizeProp } = props;
  const canvasSize = canvasSizeProp ?? DEFAULT_CANVAS_SIZE;
  const animationSpeedMs = variables.animationSpeedMs ?? DEFAULT_ANIMATION_SPEED_MS;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Float32Array>(new Float32Array(GRID_RESOLUTION * GRID_RESOLUTION));
  const isDrawingRef = useRef(false);
  const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const playbackStateRef = useRef<'idle' | 'playing'>('idle');
  const commandIndexRef = useRef(0);
  const lastPosRef = useRef<{ gx: number; gy: number } | null>(null);
  const tickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentRafRef = useRef<number | null>(null);
  const segmentStartTimeRef = useRef(0);
  const segmentFromRef = useRef<{ gx: number; gy: number } | null>(null);
  const segmentToRef = useRef<{ gx: number; gy: number } | null>(null);
  const segmentLastAppliedRef = useRef<{ gx: number; gy: number } | null>(null);
  const segmentCommandIdxRef = useRef(0);
  /** Current laser position in grid coords when playing; null when idle. Used to draw laser pointer. */
  const laserPositionRef = useRef<{ gx: number; gy: number } | null>(null);
  /** Whether the laser is on (burning) during playback. Starts false at (0,0). */
  const laserOnRef = useRef(false);

  const [playbackState, setPlaybackState] = useState<'idle' | 'playing'>('idle');
  const [redrawTick, setRedrawTick] = useState(0);
  const [showPath, setShowPath] = useState(false);

  /** Convert client coords to grid coords for the canvas. */
  const clientToGrid = useCallback(
    (clientX: number, clientY: number): { gx: number; gy: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scale = canvasSize / rect.width;
      const px = (clientX - rect.left) * scale;
      const py = (clientY - rect.top) * scale;
      return {
        gx: (px / canvasSize) * GRID_RESOLUTION,
        gy: (py / canvasSize) * GRID_RESOLUTION,
      };
    },
    [canvasSize]
  );

  /** Apply burn at grid coords only (no redraw tick). */
  const applyBurnAtGrid = useCallback(
    (gx: number, gy: number) => {
      const radiusGrid = Math.max(1, variables.radius * RADIUS_TO_GRID);
      applyBurn(
        gridRef.current,
        gx,
        gy,
        radiusGrid,
        variables.power * 0.02,
        variables.radialFalloff,
        MAX_VALUE,
        GRID_RESOLUTION
      );
    },
    [variables.radius, variables.power, variables.radialFalloff]
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawGrid(ctx, gridRef.current, colorPalette, canvasSize, GRID_RESOLUTION, MAX_VALUE);
    if (showPath && commands && commands.length > 0) {
      drawCommandPath(ctx, commands, canvasSize, BURN_COORD_MAX);
    }
    // Laser pointer: red dot with fading radius when playing
    if (playbackState === 'playing') {
      const pos = laserPositionRef.current;
      if (pos != null) {
        const cellW = canvasSize / GRID_RESOLUTION;
        const cellH = canvasSize / GRID_RESOLUTION;
        const px = (pos.gx + 0.5) * cellW;
        const py = (pos.gy + 0.5) * cellH;
        const r = Math.max(cellW, cellH) * 4;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, r);
        gradient.addColorStop(0, 'rgba(255, 60, 60, 0.95)');
        gradient.addColorStop(0.25, 'rgba(255, 60, 60, 0.5)');
        gradient.addColorStop(0.6, 'rgba(255, 60, 60, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 60, 60, 0)');
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }
  }, [colorPalette, commands, showPath, canvasSize, playbackState]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, variables, playbackState, redrawTick]);

  const applyAtPointer = useCallback(
    (clientX: number, clientY: number) => {
      const g = clientToGrid(clientX, clientY);
      if (g) applyBurnAtGrid(g.gx, g.gy);
    },
    [clientToGrid, applyBurnAtGrid]
  );

  const runHoldLoop = useCallback(() => {
    const loop = () => {
      if (!isDrawingRef.current) {
        holdRafRef.current = null;
        return;
      }
      const pos = lastPointerRef.current;
      if (pos) applyAtPointer(pos.clientX, pos.clientY);
      setRedrawTick((n) => n + 1);
      holdRafRef.current = requestAnimationFrame(loop);
    };
    holdRafRef.current = requestAnimationFrame(loop);
  }, [applyAtPointer]);

  const stopHoldLoop = useCallback(() => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    lastPointerRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (playbackStateRef.current === 'playing') return;
      isDrawingRef.current = true;
      lastPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      applyAtPointer(e.clientX, e.clientY);
      setRedrawTick((n) => n + 1);
      runHoldLoop();
    },
    [applyAtPointer, runHoldLoop]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      const prev = lastPointerRef.current;
      lastPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
      const g1 = clientToGrid(e.clientX, e.clientY);
      if (!g1) return;
      if (prev) {
        const g0 = clientToGrid(prev.clientX, prev.clientY);
        if (g0) {
          const dist = Math.hypot(g1.gx - g0.gx, g1.gy - g0.gy);
          const steps = Math.min(
            DRAG_INTERPOLATION_MAX,
            Math.max(DRAG_INTERPOLATION_MIN, Math.ceil(dist))
          );
          for (let i = 1; i < steps; i++) {
            const t = i / steps;
            applyBurnAtGrid(
              g0.gx + (g1.gx - g0.gx) * t,
              g0.gy + (g1.gy - g0.gy) * t
            );
          }
        }
      }
      applyBurnAtGrid(g1.gx, g1.gy);
    },
    [clientToGrid, applyBurnAtGrid]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDrawingRef.current = false;
    stopHoldLoop();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [stopHoldLoop]);

  const handlePointerLeave = useCallback(() => {
    isDrawingRef.current = false;
    stopHoldLoop();
  }, [stopHoldLoop]);

  const runPlayback = useCallback(() => {
    const list = commands;
    if (!list || list.length === 0) {
      setPlaybackState('idle');
      playbackStateRef.current = 'idle';
      return;
    }
    const idx = commandIndexRef.current;
    if (idx >= list.length) {
      setPlaybackState('idle');
      playbackStateRef.current = 'idle';
      commandIndexRef.current = 0;
      lastPosRef.current = null;
      laserPositionRef.current = null;
      laserOnRef.current = false;
      return;
    }
    const cmd = list[idx];
    const radiusGrid = Math.max(1, variables.radius * RADIUS_TO_GRID);
    const power = variables.power * 0.02;
    const falloff = variables.radialFalloff;

    if (cmd.type === 'on') {
      laserOnRef.current = true;
      laserPositionRef.current = lastPosRef.current != null ? { ...lastPosRef.current } : null;
      commandIndexRef.current = idx + 1;
      tickTimeoutRef.current = setTimeout(runPlayback, 0);
      setRedrawTick((n) => n + 1);
      return;
    }
    if (cmd.type === 'off') {
      laserOnRef.current = false;
      lastPosRef.current = null;
      laserPositionRef.current = null;
      commandIndexRef.current = idx + 1;
      tickTimeoutRef.current = setTimeout(runPlayback, 0);
      setRedrawTick((n) => n + 1);
      return;
    }
    if (cmd.type === 'goto' && cmd.x != null && cmd.y != null) {
      const { gx: toGx, gy: toGy } = cmdToGrid(cmd.x, cmd.y, BURN_COORD_MAX, GRID_RESOLUTION);
      const last = lastPosRef.current;
      const from = last ?? { gx: 0, gy: 0 };
      const zeroLength = from.gx === toGx && from.gy === toGy;
      if (zeroLength) {
        lastPosRef.current = { gx: toGx, gy: toGy };
        commandIndexRef.current = idx + 1;
        tickTimeoutRef.current = setTimeout(runPlayback, 0);
        return;
      }
      if (last != null) {
        // Lerp from last to target over time using rAF
        segmentFromRef.current = last;
        segmentToRef.current = { gx: toGx, gy: toGy };
        segmentStartTimeRef.current = performance.now();
        segmentLastAppliedRef.current = last;
        segmentCommandIdxRef.current = idx;

        const segmentLoop = () => {
          if (playbackStateRef.current !== 'playing') {
            segmentRafRef.current = null;
            return;
          }
          const from = segmentFromRef.current!;
          const to = segmentToRef.current!;
          const elapsed = performance.now() - segmentStartTimeRef.current;
          const t = Math.min(elapsed / animationSpeedMs, 1);
          const gx = from.gx + (to.gx - from.gx) * t;
          const gy = from.gy + (to.gy - from.gy) * t;
          laserPositionRef.current = { gx, gy };

          // Apply burn along segment only when laser is on
          if (laserOnRef.current) {
            const lastApplied = segmentLastAppliedRef.current!;
            for (let i = 1; i <= PLAYBACK_SUBSTEPS_PER_FRAME; i++) {
              const u = i / PLAYBACK_SUBSTEPS_PER_FRAME;
              const sx = lastApplied.gx + (gx - lastApplied.gx) * u;
              const sy = lastApplied.gy + (gy - lastApplied.gy) * u;
              applyBurn(gridRef.current, sx, sy, radiusGrid, power, falloff, MAX_VALUE, GRID_RESOLUTION);
            }
          }
          segmentLastAppliedRef.current = { gx, gy };
          setRedrawTick((n) => n + 1);

          if (t >= 1) {
            lastPosRef.current = { gx: to.gx, gy: to.gy };
            commandIndexRef.current = segmentCommandIdxRef.current + 1;
            segmentRafRef.current = null;
            segmentFromRef.current = null;
            segmentToRef.current = null;
            segmentLastAppliedRef.current = null;
            tickTimeoutRef.current = setTimeout(runPlayback, 0);
            return;
          }
          segmentRafRef.current = requestAnimationFrame(segmentLoop);
        };
        segmentRafRef.current = requestAnimationFrame(segmentLoop);
      } else {
        // Laser starts at (0,0); animate from origin to first point without burning
        const start = { gx: 0, gy: 0 };
        segmentFromRef.current = start;
        segmentToRef.current = { gx: toGx, gy: toGy };
        segmentStartTimeRef.current = performance.now();
        segmentLastAppliedRef.current = start;
        segmentCommandIdxRef.current = idx;

        const segmentLoop = () => {
          if (playbackStateRef.current !== 'playing') {
            segmentRafRef.current = null;
            return;
          }
          const from = segmentFromRef.current!;
          const to = segmentToRef.current!;
          const elapsed = performance.now() - segmentStartTimeRef.current;
          const t = Math.min(elapsed / animationSpeedMs, 1);
          const gx = from.gx + (to.gx - from.gx) * t;
          const gy = from.gy + (to.gy - from.gy) * t;
          laserPositionRef.current = { gx, gy };

          if (laserOnRef.current) {
            const lastApplied = segmentLastAppliedRef.current!;
            for (let i = 1; i <= PLAYBACK_SUBSTEPS_PER_FRAME; i++) {
              const u = i / PLAYBACK_SUBSTEPS_PER_FRAME;
              const sx = lastApplied.gx + (gx - lastApplied.gx) * u;
              const sy = lastApplied.gy + (gy - lastApplied.gy) * u;
              applyBurn(gridRef.current, sx, sy, radiusGrid, power, falloff, MAX_VALUE, GRID_RESOLUTION);
            }
          }
          segmentLastAppliedRef.current = { gx, gy };
          setRedrawTick((n) => n + 1);

          if (t >= 1) {
            lastPosRef.current = { gx: to.gx, gy: to.gy };
            commandIndexRef.current = segmentCommandIdxRef.current + 1;
            segmentRafRef.current = null;
            segmentFromRef.current = null;
            segmentToRef.current = null;
            segmentLastAppliedRef.current = null;
            tickTimeoutRef.current = setTimeout(runPlayback, 0);
            return;
          }
          segmentRafRef.current = requestAnimationFrame(segmentLoop);
        };
        segmentRafRef.current = requestAnimationFrame(segmentLoop);
      }
      return;
    }
    tickTimeoutRef.current = setTimeout(runPlayback, animationSpeedMs);
  }, [commands, variables.radius, variables.power, variables.radialFalloff, variables.animationSpeedMs]);

  const handlePlay = useCallback(() => {
    if (!commands || commands.length === 0) return;
    playbackStateRef.current = 'playing';
    setPlaybackState('playing');
    laserOnRef.current = false;
    if (commandIndexRef.current >= commands.length) commandIndexRef.current = 0;
    runPlayback();
  }, [commands, runPlayback]);

  const handlePause = useCallback(() => {
    if (tickTimeoutRef.current) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
    if (segmentRafRef.current !== null) {
      cancelAnimationFrame(segmentRafRef.current);
      segmentRafRef.current = null;
    }
    playbackStateRef.current = 'idle';
    laserPositionRef.current = null;
    laserOnRef.current = false;
    setPlaybackState('idle');
  }, []);

  const handleStop = useCallback(() => {
    if (tickTimeoutRef.current) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
    if (segmentRafRef.current !== null) {
      cancelAnimationFrame(segmentRafRef.current);
      segmentRafRef.current = null;
    }
    playbackStateRef.current = 'idle';
    laserPositionRef.current = null;
    laserOnRef.current = false;
    setPlaybackState('idle');
    commandIndexRef.current = 0;
    lastPosRef.current = null;
    segmentFromRef.current = null;
    segmentToRef.current = null;
    segmentLastAppliedRef.current = null;
    setRedrawTick((n) => n + 1);
  }, []);

  const handleReset = useCallback(() => {
    if (tickTimeoutRef.current) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
    if (segmentRafRef.current !== null) {
      cancelAnimationFrame(segmentRafRef.current);
      segmentRafRef.current = null;
    }
    playbackStateRef.current = 'idle';
    laserPositionRef.current = null;
    laserOnRef.current = false;
    setPlaybackState('idle');
    commandIndexRef.current = 0;
    lastPosRef.current = null;
    segmentFromRef.current = null;
    segmentToRef.current = null;
    segmentLastAppliedRef.current = null;
    gridRef.current.fill(0);
    setRedrawTick((n) => n + 1);
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    return () => {
      if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
      if (holdRafRef.current !== null) cancelAnimationFrame(holdRafRef.current);
      if (segmentRafRef.current !== null) cancelAnimationFrame(segmentRafRef.current);
    };
  }, []);

  const showPlaybackControls = commands != null && commands.length > 0;
  const isPlaying = playbackState === 'playing';

  return (
    <div className="burn-visualization">
      <div className="burn-visualization-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="burn-visualization-canvas"
          width={canvasSize}
          height={canvasSize}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerUp}
          aria-label="Burn accumulation canvas; drag or hold to add heat"
        />
        <button
          type="button"
          className="burn-visualization-btn burn-visualization-reset"
          onClick={handleReset}
          aria-label="Reset canvas"
          title="Reset canvas"
        >
          <span className="burn-visualization-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </span>
        </button>
        {showPlaybackControls && (
          <button
            type="button"
            className={`burn-visualization-btn burn-visualization-path-toggle ${showPath ? 'active' : ''}`}
            onClick={() => setShowPath((v) => !v)}
            aria-label={showPath ? 'Hide path' : 'Show path'}
            title={showPath ? 'Hide path' : 'Show path'}
          >
            <span className="burn-visualization-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round">
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </span>
          </button>
        )}
        {showPlaybackControls && (
          <div className="burn-visualization-controls">
            {!isPlaying ? (
              <button
                type="button"
                className="burn-visualization-btn burn-visualization-play"
                onClick={handlePlay}
                aria-label="Play commands"
              >
                <span className="burn-visualization-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="burn-visualization-btn burn-visualization-pause"
                  onClick={handlePause}
                  aria-label="Pause"
                >
                  <span className="burn-visualization-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  </span>
                </button>
                <button
                  type="button"
                  className="burn-visualization-btn burn-visualization-stop"
                  onClick={handleStop}
                  aria-label="Stop"
                >
                  <span className="burn-visualization-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

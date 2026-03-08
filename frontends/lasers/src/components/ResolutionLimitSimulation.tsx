import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addBurnHeatAlongLine,
  BURN_CANVAS_SIZE,
  BURN_COORD_MAX,
  BURN_HEAT_PER_POINT,
  createBurnHeatGrid,
  drawBurnCanvas,
} from '../lib/burnCanvas';
import './ResolutionLimitSimulation.css';

const PATH_LENGTH = 120; // path length in "machine steps" (number of minimum steps along the path)
const MACHINE_MIN_STEP = 1;
const MAX_STEP_SIZE = 12;
const SEGMENT_DURATION_MS = 80;

/** Points along a circle (0..1) for drawing the path. */
function circlePoints(numPoints: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const cx = 0.5;
  const cy = 0.5;
  const r = 0.42;
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
    out.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return out;
}

/** One point every `stepSize` machine steps along the path (path has PATH_LENGTH steps). */
function sampleIndices(stepSize: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < PATH_LENGTH; i += stepSize) {
    indices.push(i);
  }
  return indices;
}

/** Path in 0..100 coords for burn canvas, with laser on for all segments (closed circle). */
function buildBurnPath(pathPoints01: { x: number; y: number }[], sampledIndices: number[]): { x: number; y: number }[] {
  const points = sampledIndices
    .map((i) => pathPoints01[i])
    .filter(Boolean)
    .map((p) => ({ x: p.x * BURN_COORD_MAX, y: p.y * BURN_COORD_MAX }));
  if (points.length < 2) return points;
  return [...points, points[0]];
}

export type ResolutionLimitSimulationProps = Record<string, never>;

export function ResolutionLimitSimulation(_props: ResolutionLimitSimulationProps): JSX.Element {
  const [stepSize, setStepSize] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);

  const pathPoints = useMemo(() => circlePoints(PATH_LENGTH), []);
  const sampledIndices = useMemo(() => sampleIndices(stepSize), [stepSize]);
  const atMaximum = stepSize <= MACHINE_MIN_STEP;
  /** Display DPI: higher number = finer resolution. 1000 at step 1, 100 at step 12. */
  const dpiDisplay = Math.round(100 + (MAX_STEP_SIZE - stepSize) * (900 / 11));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatGridRef = useRef<Float32Array>(createBurnHeatGrid());
  const rafRef = useRef<number>(0);
  const playStateRef = useRef<{
    path: { x: number; y: number }[];
    totalSegments: number;
    startTime: number;
    lastBurnX: number;
    lastBurnY: number;
    lastTargetSegment: number;
  } | null>(null);
  const playCancelledRef = useRef(false);

  const burnPath = useMemo(
    () => buildBurnPath(pathPoints, sampledIndices),
    [pathPoints, sampledIndices]
  );
  const laserSegments = useMemo(() => burnPath.length > 1 ? burnPath.slice(0, -1).map(() => true) : [], [burnPath]);

  const drawCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      path: { x: number; y: number }[],
      segmentsOn: boolean[],
      laserHead?: { x: number; y: number }
    ) => {
      drawBurnCanvas(ctx, heatGridRef.current, path, segmentsOn, { laserHead });
    },
    []
  );

  useEffect(() => {
    if (isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCanvas(ctx, burnPath, laserSegments);
  }, [isPlaying, burnPath, laserSegments, drawCanvas]);

  useEffect(() => {
    return () => {
      playCancelledRef.current = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (burnPath.length < 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalSegments = burnPath.length - 1;
    cancelAnimationFrame(rafRef.current);
    playCancelledRef.current = false;
    const startTime = performance.now();
    playStateRef.current = {
      path: burnPath,
      totalSegments,
      startTime,
      lastBurnX: burnPath[0].x,
      lastBurnY: burnPath[0].y,
      lastTargetSegment: -1,
    };
    setIsPlaying(true);

    const tick = (now: number) => {
      if (playCancelledRef.current) return;
      const state = playStateRef.current;
      if (!state) return;
      const { path: p, totalSegments: total, startTime: start } = state;
      const elapsed = now - start;
      const targetSegment = Math.min(Math.floor(elapsed / SEGMENT_DURATION_MS), total);

      if (targetSegment >= total) {
        playStateRef.current = null;
        setIsPlaying(false);
        drawCanvas(ctx, p, laserSegments);
        return;
      }

      const partialPath = p.slice(0, targetSegment + 2);
      const partialLaser = laserSegments.slice(0, targetSegment + 1);
      const t = Math.max(0, Math.min(1, (elapsed - targetSegment * SEGMENT_DURATION_MS) / SEGMENT_DURATION_MS));
      const a = p[targetSegment];
      const b = p[targetSegment + 1];
      const current = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      partialPath[partialPath.length - 1] = current;

      if (Number.isFinite(current.x) && Number.isFinite(current.y)) {
        if (state.lastTargetSegment !== targetSegment) {
          state.lastBurnX = a.x;
          state.lastBurnY = a.y;
          state.lastTargetSegment = targetSegment;
        }
        addBurnHeatAlongLine(heatGridRef.current, state.lastBurnX, state.lastBurnY, current.x, current.y, BURN_HEAT_PER_POINT);
        state.lastBurnX = current.x;
        state.lastBurnY = current.y;
      }

      drawCanvas(ctx, partialPath, partialLaser, current);
      rafRef.current = requestAnimationFrame(tick);
    };
    requestAnimationFrame(() => {
      if (playCancelledRef.current || !playStateRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    });
  }, [burnPath, laserSegments, drawCanvas]);

  const handleReset = useCallback(() => {
    heatGridRef.current = createBurnHeatGrid();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCanvas(ctx, burnPath, laserSegments);
  }, [burnPath, laserSegments, drawCanvas]);

  return (
    <div className="resolution-limit-sim">
      <div className="resolution-limit-sim-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="resolution-limit-sim-canvas"
          width={BURN_CANVAS_SIZE}
          height={BURN_CANVAS_SIZE}
          aria-label="Engraving preview"
        />
        <p className="resolution-limit-sim-canvas-label">Preview: what the path would engrave at this DPI.</p>
        <div className="resolution-limit-sim-actions">
          <button
            type="button"
            className="resolution-limit-sim-play"
            onClick={handlePlay}
            disabled={burnPath.length < 2 || isPlaying}
          >
            {isPlaying ? 'Playing…' : 'Play'}
          </button>
          <button type="button" className="resolution-limit-sim-reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
      <div className="resolution-limit-sim-controls">
        <label className="resolution-limit-sim-label">
          <span className="resolution-limit-sim-label-text">DPI (dots per inch)</span>
          <span className="resolution-limit-sim-value">
            {dpiDisplay}
            {atMaximum ? ' (machine maximum)' : ''}
          </span>
        </label>
        <input
          type="range"
          min={MACHINE_MIN_STEP}
          max={MAX_STEP_SIZE}
          value={stepSize}
          onChange={(e) => setStepSize(Number(e.target.value))}
          className="resolution-limit-sim-slider"
          aria-valuemin={MACHINE_MIN_STEP}
          aria-valuemax={MAX_STEP_SIZE}
          aria-valuenow={stepSize}
          aria-valuetext={atMaximum ? `${dpiDisplay} DPI (machine maximum)` : `${dpiDisplay} DPI`}
        />
        <p className="resolution-limit-sim-hint">
          Higher DPI → finer resolution. Lower DPI → coarser. You cannot exceed the machine maximum.
        </p>
      </div>
    </div>
  );
}

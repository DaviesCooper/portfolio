import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ResolutionLimitSimulation.css';

const PATH_LENGTH = 120; // path length in "machine steps" (number of minimum steps along the path)
const MACHINE_MIN_STEP = 1;
const MAX_STEP_SIZE = 12;

/** Canvas and burn effect (match GCodePathSimulation). */
const CANVAS_SIZE = 320;
const COORD_MAX = 100;
const GRID_SIZE = 128;
const HEAT_RADIUS = 4;
const HEAT_PER_POINT = 0.08;
const BURN_STEP_PATH = 1;
const CUT_THRESHOLD = 1;
const MATERIAL_WOOD = { r: 196, g: 165, b: 116 };
const OPAQUE_BLACK_H = 0.2;
const SEGMENT_DURATION_MS = 80;

function createHeatGrid(): Float32Array {
  return new Float32Array(GRID_SIZE * GRID_SIZE);
}

function addHeat(grid: Float32Array, cx: number, cy: number, amount: number): void {
  const r = Math.ceil(HEAT_RADIUS);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const col = Math.floor(cx) + dx;
      const row = Math.floor(cy) + dy;
      if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) continue;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > HEAT_RADIUS) continue;
      const falloff = 1 - dist / (HEAT_RADIUS + 1);
      const idx = row * GRID_SIZE + col;
      const next = grid[idx] + amount * falloff;
      grid[idx] = Math.min(CUT_THRESHOLD, next);
    }
  }
}

function heatToRgbWood(h: number, bgColor: string): string {
  if (h <= 0) return `rgb(${MATERIAL_WOOD.r},${MATERIAL_WOOD.g},${MATERIAL_WOOD.b})`;
  if (h >= CUT_THRESHOLD) return bgColor;
  if (h <= OPAQUE_BLACK_H) {
    const t = h / OPAQUE_BLACK_H;
    const r = Math.round(MATERIAL_WOOD.r * (1 - t));
    const g = Math.round(MATERIAL_WOOD.g * (1 - t));
    const b = Math.round(MATERIAL_WOOD.b * (1 - t));
    return `rgb(${r},${g},${b})`;
  }
  return '#0a0a0a';
}

function pathToGrid(c: number): number {
  return (c / COORD_MAX) * (GRID_SIZE - 1);
}

function addHeatAlongLine(
  grid: Float32Array,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  amount: number
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1e-6;
  const numSteps = Math.max(1, Math.ceil(len / BURN_STEP_PATH));
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const x = fromX + dx * t;
    const y = fromY + dy * t;
    addHeat(grid, pathToGrid(x), pathToGrid(y), amount);
  }
}

function px(c: number): number {
  const padding = 8;
  const inner = CANVAS_SIZE - padding * 2;
  return padding + (c / COORD_MAX) * inner;
}

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
    .map((p) => ({ x: p.x * COORD_MAX, y: p.y * COORD_MAX }));
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
  const heatGridRef = useRef<Float32Array>(createHeatGrid());
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
      const grid = heatGridRef.current;
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#030712';
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const inset = 2;
      const innerW = CANVAS_SIZE - 2 * inset;
      const innerH = CANVAS_SIZE - 2 * inset;

      ctx.save();
      ctx.beginPath();
      ctx.rect(inset, inset, innerW, innerH);
      ctx.clip();

      const cellSize = innerW / GRID_SIZE;
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const x = inset + Math.floor(col * cellSize);
          const y = inset + Math.floor(row * cellSize);
          const xEnd = col < GRID_SIZE - 1 ? inset + Math.floor((col + 1) * cellSize) : inset + innerW;
          const yEnd = row < GRID_SIZE - 1 ? inset + Math.floor((row + 1) * cellSize) : inset + innerH;
          const w = Math.max(1, Math.min(xEnd - x, inset + innerW - x));
          const h = Math.max(1, Math.min(yEnd - y, inset + innerH - y));
          const hVal = grid[row * GRID_SIZE + col];
          ctx.fillStyle = heatToRgbWood(hVal, bgColor);
          ctx.fillRect(x, y, w, h);
        }
      }

      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--fg-muted').trim() || '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      for (let i = 1; i < path.length; i++) {
        ctx.beginPath();
        ctx.moveTo(px(path[i - 1].x), px(path[i - 1].y));
        ctx.lineTo(px(path[i].x), px(path[i].y));
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      let started = false;
      let prevWasLaserOff = true;
      for (let i = 1; i < path.length; i++) {
        if (!segmentsOn[i - 1]) {
          prevWasLaserOff = true;
          continue;
        }
        if (!started) {
          ctx.beginPath();
          started = true;
        }
        if (prevWasLaserOff) ctx.moveTo(px(path[i - 1].x), px(path[i - 1].y));
        ctx.lineTo(px(path[i].x), px(path[i].y));
        prevWasLaserOff = false;
      }
      if (started) ctx.stroke();

      if (laserHead != null && Number.isFinite(laserHead.x) && Number.isFinite(laserHead.y)) {
        const headX = px(laserHead.x);
        const headY = px(laserHead.y);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';
        ctx.beginPath();
        ctx.arc(headX, headY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
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
        addHeatAlongLine(heatGridRef.current, state.lastBurnX, state.lastBurnY, current.x, current.y, HEAT_PER_POINT);
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
    heatGridRef.current = createHeatGrid();
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
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
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

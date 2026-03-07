import { useCallback, useEffect, useRef, useState } from 'react';
import './BurnSimulation.css';

const GRID_COLS = 128;
const GRID_ROWS = 128;
const HEAT_RADIUS = 4;
const BASE_HEAT_RATE = 0.05;
const CUT_THRESHOLD = 1;

/** Heat per cell: 0 = untouched, 0..1 = darkening, 1 = cut through (red). */
function createGrid(): Float32Array {
  return new Float32Array(GRID_COLS * GRID_ROWS);
}

function addHeat(grid: Float32Array, cx: number, cy: number, amount: number): void {
  const r = Math.ceil(HEAT_RADIUS);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const col = Math.floor(cx) + dx;
      const row = Math.floor(cy) + dy;
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) continue;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > HEAT_RADIUS) continue;
      const falloff = 1 - dist / (HEAT_RADIUS + 1);
      const idx = row * GRID_COLS + col;
      const next = grid[idx] + amount * falloff;
      grid[idx] = Math.min(CUT_THRESHOLD, next);
    }
  }
}

/** Blue light: wood-like material → transparent black → black → red. */
const MATERIAL_BLUE = { r: 196, g: 165, b: 116 };
const OPAQUE_BLACK_H = 0.2;

/** IR: aluminum base. Anodized aluminum heat-tint: straw → yellow → purple → blue → dark. */
const MATERIAL_IR = { r: 176, g: 176, b: 176 }; // aluminum

function heatToRgbBlue(h: number, bgColor: string): string {
  if (h <= 0) return `rgb(${MATERIAL_BLUE.r},${MATERIAL_BLUE.g},${MATERIAL_BLUE.b})`;
  if (h >= CUT_THRESHOLD) return bgColor; // cut through — match background
  if (h <= OPAQUE_BLACK_H) {
    const t = h / OPAQUE_BLACK_H;
    const r = Math.round(MATERIAL_BLUE.r * (1 - t));
    const g = Math.round(MATERIAL_BLUE.g * (1 - t));
    const b = Math.round(MATERIAL_BLUE.b * (1 - t));
    return `rgb(${r},${g},${b})`;
  }
  return '#0a0a0a';
}

function heatToRgbIr(h: number, bgColor: string): string {
  if (h <= 0) return `rgb(${MATERIAL_IR.r},${MATERIAL_IR.g},${MATERIAL_IR.b})`;
  if (h >= CUT_THRESHOLD) return bgColor; // cut through — match background
  // Anodized aluminum with IR: straw → yellow → purple → blue
  const t = h / CUT_THRESHOLD;
  if (t <= 0.25) {
    const s = t / 0.25;
    const r = Math.round(176 + (228 - 176) * s);
    const g = Math.round(176 + (214 - 176) * s);
    const b = Math.round(176 + (140 - 176) * s);
    return `rgb(${r},${g},${b})`; // aluminum → straw
  }
  if (t <= 0.5) {
    const s = (t - 0.25) / 0.25;
    const r = Math.round(228 + (230 - 228) * s);
    const g = Math.round(214 + (180 - 214) * s);
    const b = Math.round(140 + (0 - 140) * s);
    return `rgb(${r},${g},${b})`; // straw → yellow
  }
  if (t <= 0.75) {
    const s = (t - 0.5) / 0.25;
    const r = Math.round(230 + (106 - 230) * s);
    const g = Math.round(180 + (13 - 180) * s);
    const b = Math.round(0 + (173 - 0) * s);
    return `rgb(${r},${g},${b})`; // yellow → purple
  }
  const s = (t - 0.75) / 0.25;
  const r = Math.round(106 + (65 - 106) * s);
  const g = Math.round(13 + (105 - 13) * s);
  const b = Math.round(173 + (225 - 173) * s);
  return `rgb(${r},${g},${b})`; // purple → blue
}

function heatToRgb(h: number, laserType: 'ir' | 'blue' | undefined, bgColor: string): string {
  return laserType === 'ir' ? heatToRgbIr(h, bgColor) : heatToRgbBlue(h, bgColor);
}

export interface BurnSimulationProps {
  /** Power 0–100; scales ablation rate. Default 100. */
  power?: number;
  /** Laser type (XTool); for display only unless we add behavior later. */
  laserType?: 'ir' | 'blue';
}

export function BurnSimulation(props: BurnSimulationProps): JSX.Element {
  const { power = 100, laserType } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Float32Array>(createGrid());
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number>(0);
  const lastPosRef = useRef<{ col: number; row: number } | null>(null);
  const heatRate = BASE_HEAT_RATE * (power / 100);

  useEffect(() => {
    gridRef.current = createGrid();
  }, [laserType]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgColor =
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#030712';

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const h = grid[row * GRID_COLS + col];
        ctx.fillStyle = heatToRgb(h, laserType, bgColor);
        ctx.fillRect(col, row, 1, 1);
      }
    }
  }, [laserType]);

  const cellFromEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { col: 0, row: 0 };
    const rect = canvas.getBoundingClientRect();
    const col = ((e.clientX - rect.left) / rect.width) * GRID_COLS;
    const row = ((e.clientY - rect.top) / rect.height) * GRID_ROWS;
    return { col, row };
  }, []);

  const tick = useCallback(() => {
    if (isDragging && lastPosRef.current) {
      const { col, row } = lastPosRef.current;
      addHeat(gridRef.current, col, row, heatRate);
    }
    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, isDragging, heatRate]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      lastPosRef.current = cellFromEvent(e);
      setIsDragging(true);
    },
    [cellFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) lastPosRef.current = cellFromEvent(e);
    },
    [isDragging, cellFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    lastPosRef.current = null;
  }, []);
  const handlePointerLeave = useCallback(() => {
    setIsDragging(false);
    lastPosRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    gridRef.current = createGrid();
  }, []);

  useEffect(() => {
    const onUp = () => setIsDragging(false);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = GRID_COLS * dpr;
    canvas.height = GRID_ROWS * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    draw();
  }, [draw]);

  return (
    <div className="burn-simulation-wrap">
      <canvas
        ref={canvasRef}
        className="burn-simulation-canvas"
        width={GRID_COLS}
        height={GRID_ROWS}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
        aria-label="Drag to simulate laser burning material; areas turn red when cut through"
      />
      <p className="burn-simulation-caption">Drag to engrave (black); hold in one spot to ablate until it cuts through (background color).</p>
      <button type="button" className="burn-simulation-reset" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
}

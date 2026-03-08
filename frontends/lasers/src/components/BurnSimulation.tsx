import { useCallback, useEffect, useRef, useState } from 'react';
import { addBurnHeat, createBurnHeatGrid, BURN_GRID_SIZE } from '../lib/burnCanvas';
import './BurnSimulation.css';

const BASE_HEAT_RATE = 0.05;
const CUT_THRESHOLD = 1;

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
  /** When provided, layout is a 2x2 grid: canvas | controls, caption+reset | empty. */
  children?: React.ReactNode;
}

export function BurnSimulation(props: BurnSimulationProps): JSX.Element {
  const { power = 100, laserType, children } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Float32Array>(createBurnHeatGrid());
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number>(0);
  const lastPosRef = useRef<{ col: number; row: number } | null>(null);
  const heatRate = BASE_HEAT_RATE * (power / 100);

  useEffect(() => {
    gridRef.current = createBurnHeatGrid();
  }, [laserType]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgColor =
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#030712';

    for (let row = 0; row < BURN_GRID_SIZE; row++) {
      for (let col = 0; col < BURN_GRID_SIZE; col++) {
        const h = grid[row * BURN_GRID_SIZE + col];
        ctx.fillStyle = heatToRgb(h, laserType, bgColor);
        ctx.fillRect(col, row, 1, 1);
      }
    }
  }, [laserType]);

  const cellFromEvent = useCallback((e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { col: 0, row: 0 };
    const rect = canvas.getBoundingClientRect();
    const col = ((e.clientX - rect.left) / rect.width) * BURN_GRID_SIZE;
    const row = ((e.clientY - rect.top) / rect.height) * BURN_GRID_SIZE;
    return { col, row };
  }, []);

  const tick = useCallback(() => {
    if (isDragging && lastPosRef.current) {
      const { col, row } = lastPosRef.current;
      addBurnHeat(gridRef.current, col, row, heatRate);
    }
    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, isDragging, heatRate]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      lastPosRef.current = cellFromEvent(e);
      setIsDragging(true);
    },
    [cellFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isDragging) lastPosRef.current = cellFromEvent(e);
    },
    [isDragging, cellFromEvent]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      lastPosRef.current = null;
    },
    []
  );
  const handlePointerLeave = useCallback(() => {
    setIsDragging(false);
    lastPosRef.current = null;
  }, []);
  const handlePointerCancel = useCallback(() => {
    setIsDragging(false);
    lastPosRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    gridRef.current = createBurnHeatGrid();
  }, []);

  useEffect(() => {
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = BURN_GRID_SIZE * dpr;
    canvas.height = BURN_GRID_SIZE * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    draw();
  }, [draw]);

  const canvasEl = (
    <canvas
      ref={canvasRef}
      className="burn-simulation-canvas"
      width={BURN_GRID_SIZE}
      height={BURN_GRID_SIZE}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      aria-label="Drag to simulate laser burning material; areas turn red when cut through"
    />
  );

  const metaEl = (
    <>
      <p className="burn-simulation-caption">Drag to engrave (black); hold in one spot to ablate until it cuts through (background color).</p>
      <button type="button" className="burn-simulation-reset" onClick={handleReset}>
        Reset
      </button>
    </>
  );

  if (children != null) {
    return (
      <div className="burn-principles-grid">
        <div className="burn-simulation-canvas-cell">{canvasEl}</div>
        <div className="burn-principles-controls-cell">{children}</div>
        <div className="burn-simulation-meta-cell">{metaEl}</div>
        <div className="burn-principles-empty-cell" />
      </div>
    );
  }

  return (
    <div className="burn-simulation-wrap">
      {canvasEl}
      {metaEl}
    </div>
  );
}

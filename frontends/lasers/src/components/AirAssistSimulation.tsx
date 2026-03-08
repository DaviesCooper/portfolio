import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addBurnHeatVariable,
  BURN_GRID_SIZE,
  burnHeatToRgbWood,
  createBurnHeatGrid,
} from '../lib/burnCanvas';
import { PowerSlider } from './PowerSlider';
import './AirAssistSimulation.css';

const BASE_HEAT_RATE_MIN = 0.02;
const BASE_HEAT_RATE_MAX = 0.08;
const RADIUS_MIN = 2;
const RADIUS_MAX = 8;

export type AirAssistSimulationProps = Record<string, never>;

export function AirAssistSimulation(_props: AirAssistSimulationProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Float32Array>(createBurnHeatGrid());
  const [isDragging, setIsDragging] = useState(false);
  const [airLevel, setAirLevel] = useState(50); // 0–100
  const rafRef = useRef<number>(0);
  const lastPosRef = useRef<{ col: number; row: number } | null>(null);

  const heatRate =
    BASE_HEAT_RATE_MIN + (BASE_HEAT_RATE_MAX - BASE_HEAT_RATE_MIN) * (airLevel / 100);
  const radius = RADIUS_MIN + (RADIUS_MAX - RADIUS_MIN) * (airLevel / 100);

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
        ctx.fillStyle = burnHeatToRgbWood(h, bgColor);
        ctx.fillRect(col, row, 1, 1);
      }
    }
  }, []);

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
      addBurnHeatVariable(gridRef.current, col, row, heatRate, radius);
    }
    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, isDragging, heatRate, radius]);

  useEffect(() => {
    gridRef.current = createBurnHeatGrid();
  }, []);

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

  return (
    <div className="air-assist-sim-row">
      <div className="air-assist-sim-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="air-assist-sim-canvas"
          width={BURN_GRID_SIZE}
          height={BURN_GRID_SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
          aria-label="Drag to burn; adjust Air to change burn speed and spread"
        />
        <p className="air-assist-sim-caption">
          Drag to burn. More air → faster cut-through and wider burn radius.
        </p>
        <button type="button" className="air-assist-sim-reset" onClick={handleReset}>
          Reset
        </button>
      </div>
      <div className="air-assist-sim-controls">
        <div className="air-assist-sim-control">
          <span className="air-assist-sim-control-label">Air</span>
          <PowerSlider
            value={airLevel}
            onChange={setAirLevel}
            aria-label="Air 0 to 100"
          />
        </div>
      </div>
    </div>
  );
}

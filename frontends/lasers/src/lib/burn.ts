import { Command } from "./command";
import { Gradient } from "./gradient";

export function applyBurn(
    grid: Float32Array,
    cx: number,
    cy: number,
    radiusGrid: number,
    power: number,
    radialFalloff: number,
    maxValue: number,
    gridResolution: number,
): void {
    const r0 = Math.max(0, Math.floor(cx - radiusGrid));
    const r1 = Math.min(gridResolution - 1, Math.ceil(cx + radiusGrid));
    const s0 = Math.max(0, Math.floor(cy - radiusGrid));
    const s1 = Math.min(gridResolution - 1, Math.ceil(cy + radiusGrid));
    const r2 = radiusGrid * radiusGrid;
    for (let j = s0; j <= s1; j++) {
        for (let i = r0; i <= r1; i++) {
            const dx = i - cx;
            const dy = j - cy;
            const d2 = dx * dx + dy * dy;
            if (d2 > r2) continue;
            const d = Math.sqrt(d2);
            const t = d / radiusGrid; // 0 at center, 1 at edge
            // Exponential decay: higher radialFalloff = steeper decay of power toward the edge
            const factor = Math.max(0, Math.exp(-radialFalloff * t));
            const idx = j * gridResolution + i;
            grid[idx] = Math.min(maxValue, grid[idx] + power * factor);
        }
    }
}

export function drawGrid(
    ctx: CanvasRenderingContext2D,
    grid: Float32Array,
    colorPalette: Gradient,
    canvasSize: number,
    gridResolution: number,
    maxValue: number
): void {
    for (let j = 0; j < gridResolution; j++) {
        for (let i = 0; i < gridResolution; i++) {
            const v = grid[j * gridResolution + i];
            const t = v / maxValue;
            ctx.fillStyle = colorPalette.evaluateCSS(t);
            const x0 = Math.floor((i * canvasSize) / gridResolution);
            const y0 = Math.floor((j * canvasSize) / gridResolution);
            const x1 = Math.floor(((i + 1) * canvasSize) / gridResolution);
            const y1 = Math.floor(((j + 1) * canvasSize) / gridResolution);
            const w = Math.max(1, x1 - x0);
            const h = Math.max(1, y1 - y0);
            ctx.fillRect(x0, y0, w, h);
        }
    }
}

export function cmdToGrid(x: number, y: number, burnCoordMax: number, gridResolution: number): { gx: number; gy: number } {
    const gx = (x / burnCoordMax) * (gridResolution - 1);
    const gy = (y / burnCoordMax) * (gridResolution - 1);
    return { gx, gy };
}

/** Command space 0..burnCoordMax → canvas pixels 0..canvasSize */
export function cmdToCanvas(
    x: number,
    y: number,
    burnCoordMax: number,
    canvasSize: number
  ): { px: number; py: number } {
    return {
      px: (x / burnCoordMax) * canvasSize,
      py: (y / burnCoordMax) * canvasSize,
    };
  }
  
  export function drawCommandPath(
    ctx: CanvasRenderingContext2D,
    commands: Command[],
    canvasSize: number,
    burnCoordMax: number
  ): void {
    const accent =
      getComputedStyle(ctx.canvas).getPropertyValue('--accent').trim() || '#2dd4bf';
    let laserOn = false;
    /** Laser is assumed to start at (0, 0) in command space. */
    let last: { px: number; py: number } = cmdToCanvas(0, 0, burnCoordMax, canvasSize);
  
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = accent;
  
    for (const cmd of commands) {
      if (cmd.type === 'on') {
        laserOn = true;
        continue;
      }
      if (cmd.type === 'off') {
        laserOn = false;
        continue;
      }
      if (cmd.type === 'goto' && cmd.x != null && cmd.y != null) {
        const { px, py } = cmdToCanvas(cmd.x, cmd.y, burnCoordMax, canvasSize);
        if (laserOn) {
          ctx.setLineDash([]);
        } else {
          ctx.setLineDash([6, 12]);
        }
        ctx.beginPath();
        ctx.moveTo(last.px, last.py);
        ctx.lineTo(px, py);
        ctx.stroke();
        last = { px, py };
      }
    }
  }
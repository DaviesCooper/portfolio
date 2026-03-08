/**
 * Shared burn/engraving simulation for laser path canvases.
 * Used by BurnSimulation, GCodePathSimulation, and ResolutionLimitSimulation.
 */

export const BURN_CANVAS_SIZE = 320;
export const BURN_COORD_MAX = 100;

export const BURN_GRID_SIZE = 128;
export const BURN_HEAT_RADIUS = 4;
export const BURN_HEAT_PER_POINT = 0.08;
export const BURN_STEP_PATH = 1;
export const BURN_CUT_THRESHOLD = 1;
const BURN_MATERIAL_WOOD = { r: 196, g: 165, b: 116 };
const BURN_OPAQUE_BLACK_H = 0.2;

export type BurnPathPoint = { x: number; y: number };

export function createBurnHeatGrid(): Float32Array {
  return new Float32Array(BURN_GRID_SIZE * BURN_GRID_SIZE);
}

export function addBurnHeat(
  grid: Float32Array,
  cx: number,
  cy: number,
  amount: number
): void {
  addBurnHeatVariable(grid, cx, cy, amount, BURN_HEAT_RADIUS);
}

/** Apply heat with variable radius (e.g. for air-assist: more air = larger spread). */
export function addBurnHeatVariable(
  grid: Float32Array,
  cx: number,
  cy: number,
  amount: number,
  radius: number
): void {
  const r = Math.ceil(radius);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const col = Math.floor(cx) + dx;
      const row = Math.floor(cy) + dy;
      if (col < 0 || col >= BURN_GRID_SIZE || row < 0 || row >= BURN_GRID_SIZE)
        continue;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      const falloff = 1 - dist / (radius + 1);
      const idx = row * BURN_GRID_SIZE + col;
      const next = grid[idx] + amount * falloff;
      grid[idx] = Math.min(BURN_CUT_THRESHOLD, next);
    }
  }
}

export function burnHeatToRgbWood(h: number, bgColor: string): string {
  if (h <= 0)
    return `rgb(${BURN_MATERIAL_WOOD.r},${BURN_MATERIAL_WOOD.g},${BURN_MATERIAL_WOOD.b})`;
  if (h >= BURN_CUT_THRESHOLD) return bgColor;
  if (h <= BURN_OPAQUE_BLACK_H) {
    const t = h / BURN_OPAQUE_BLACK_H;
    const r = Math.round(BURN_MATERIAL_WOOD.r * (1 - t));
    const g = Math.round(BURN_MATERIAL_WOOD.g * (1 - t));
    const b = Math.round(BURN_MATERIAL_WOOD.b * (1 - t));
    return `rgb(${r},${g},${b})`;
  }
  return '#0a0a0a';
}

export function burnPathToGrid(c: number): number {
  return (c / BURN_COORD_MAX) * (BURN_GRID_SIZE - 1);
}

export function addBurnHeatAlongLine(
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
    addBurnHeat(grid, burnPathToGrid(x), burnPathToGrid(y), amount);
  }
}

export function burnPathCoordToPx(c: number): number {
  const padding = 8;
  const inner = BURN_CANVAS_SIZE - padding * 2;
  return padding + (c / BURN_COORD_MAX) * inner;
}

export interface DrawBurnCanvasOptions {
  laserHead?: BurnPathPoint;
  /** When true, diagonal path segments are drawn as L-shaped (raster travel preview). */
  rasterTravelPreview?: boolean;
}

export function drawBurnCanvas(
  ctx: CanvasRenderingContext2D,
  grid: Float32Array,
  path: BurnPathPoint[],
  laserSegments: boolean[],
  options: DrawBurnCanvasOptions = {}
): void {
  const { laserHead, rasterTravelPreview = false } = options;
  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() ||
    '#030712';
  const fgMuted =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--fg-muted')
      .trim() || '#64748b';
  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim() || '#3b82f6';

  ctx.clearRect(0, 0, BURN_CANVAS_SIZE, BURN_CANVAS_SIZE);

  const inset = 2;
  const innerW = BURN_CANVAS_SIZE - 2 * inset;
  const innerH = BURN_CANVAS_SIZE - 2 * inset;

  ctx.save();
  ctx.beginPath();
  ctx.rect(inset, inset, innerW, innerH);
  ctx.clip();

  const cellSize = innerW / BURN_GRID_SIZE;
  for (let row = 0; row < BURN_GRID_SIZE; row++) {
    for (let col = 0; col < BURN_GRID_SIZE; col++) {
      const x = inset + Math.floor(col * cellSize);
      const y = inset + Math.floor(row * cellSize);
      const xEnd =
        col < BURN_GRID_SIZE - 1
          ? inset + Math.floor((col + 1) * cellSize)
          : inset + innerW;
      const yEnd =
        row < BURN_GRID_SIZE - 1
          ? inset + Math.floor((row + 1) * cellSize)
          : inset + innerH;
      const w = Math.max(1, Math.min(xEnd - x, inset + innerW - x));
      const h = Math.max(1, Math.min(yEnd - y, inset + innerH - y));
      const hVal = grid[row * BURN_GRID_SIZE + col];
      ctx.fillStyle = burnHeatToRgbWood(hVal, bgColor);
      ctx.fillRect(x, y, w, h);
    }
  }

  ctx.strokeStyle = fgMuted;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const isDiagonalTravel = rasterTravelPreview && dx !== 0 && dy !== 0;
    ctx.beginPath();
    ctx.moveTo(burnPathCoordToPx(a.x), burnPathCoordToPx(a.y));
    if (isDiagonalTravel) {
      ctx.lineTo(burnPathCoordToPx(a.x), burnPathCoordToPx(b.y));
      ctx.lineTo(burnPathCoordToPx(b.x), burnPathCoordToPx(b.y));
    } else {
      ctx.lineTo(burnPathCoordToPx(b.x), burnPathCoordToPx(b.y));
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  let started = false;
  let prevWasLaserOff = true;
  for (let i = 1; i < path.length; i++) {
    if (!laserSegments[i - 1]) {
      prevWasLaserOff = true;
      continue;
    }
    if (!started) {
      ctx.beginPath();
      started = true;
    }
    if (prevWasLaserOff)
      ctx.moveTo(burnPathCoordToPx(path[i - 1].x), burnPathCoordToPx(path[i - 1].y));
    ctx.lineTo(burnPathCoordToPx(path[i].x), burnPathCoordToPx(path[i].y));
    prevWasLaserOff = false;
  }
  if (started) ctx.stroke();

  if (
    laserHead != null &&
    Number.isFinite(laserHead.x) &&
    Number.isFinite(laserHead.y)
  ) {
    const headX = burnPathCoordToPx(laserHead.x);
    const headY = burnPathCoordToPx(laserHead.y);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(headX, headY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

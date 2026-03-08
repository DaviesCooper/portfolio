import { useMemo } from 'react';
import type { GCodeCommand } from './GCodePathSimulation';
import { GCodePathSimulation } from './GCodePathSimulation';

const COORD_MAX = 100;
/** Raster grid steps (0..steps gives steps+1 points per axis). Fewer = faster animation, more = finer detail. */
const RASTER_STEPS = 50;

/** Generates simulated raster G-code to engrave a circle. */
function generateCircleRasterGCode(steps: number): GCodeCommand[] {
  const cx = COORD_MAX / 2;
  const cy = COORD_MAX / 2;
  const r = COORD_MAX / 2 - 5;
  const r2 = r * r;

  const commands: GCodeCommand[] = [];
  const step = COORD_MAX / steps;

  function roundCoord(v: number): number {
    return Math.round(v * 10) / 10;
  }

  function insideCircle(px: number, py: number): boolean {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r2;
  }

  // Build grid x values once (same for all rows)
  const xGrid = Array.from(
    { length: steps + 1 },
    (_, i) => (i === 0 ? 0 : i === steps ? COORD_MAX : roundCoord(i * step))
  );

  // Per-row: first and last x index that are inside the circle (so each line has its own bounds)
  type RowBounds = { y: number; leftIdx: number; rightIdx: number };
  const rowBounds: RowBounds[] = [];
  for (let row = 0; row <= steps; row++) {
    const y = row === 0 ? 0 : row === steps ? COORD_MAX : roundCoord(row * step);
    let leftIdx = -1;
    let rightIdx = -1;
    for (let i = 0; i < xGrid.length; i++) {
      if (insideCircle(xGrid[i], y)) {
        if (leftIdx < 0) leftIdx = i;
        rightIdx = i;
      }
    }
    if (leftIdx >= 0 && rightIdx >= 0) rowBounds.push({ y, leftIdx, rightIdx });
  }

  for (let rIdx = 0; rIdx < rowBounds.length; rIdx++) {
    const { y, leftIdx, rightIdx } = rowBounds[rIdx];
    const leftToRight = rIdx % 2 === 0;
    const startIdx = leftToRight ? leftIdx : rightIdx;
    const endIdx = leftToRight ? rightIdx : leftIdx;
    const stepDir = leftToRight ? 1 : -1;

    if (rIdx > 0) {
      const prev = rowBounds[rIdx - 1];
      const prevLeftToRight = (rIdx - 1) % 2 === 0;
      const prevEndIdx = prevLeftToRight ? prev.rightIdx : prev.leftIdx;
      const prevEndX = xGrid[prevEndIdx];
      // Travel: move to same x as previous line end (at new y), then to this line's start
      commands.push({ type: 'M5' });
      commands.push({ type: 'G1', x: prevEndX, y });
      const thisStartX = xGrid[startIdx];
      if (prevEndX !== thisStartX) {
        commands.push({ type: 'M5' });
        commands.push({ type: 'G1', x: thisStartX, y });
      }
    }

    // Draw from startIdx to endIdx (inclusive); laser on only for this range
    commands.push({ type: 'M5' });
    commands.push({ type: 'G1', x: xGrid[startIdx], y });
    commands.push({ type: 'M3' });
    for (let i = startIdx; leftToRight ? i <= endIdx : i >= endIdx; i += stepDir) {
      commands.push({ type: 'G1', x: xGrid[i], y });
    }
  }

  return commands;
}

export type RasterPathSimulationProps = Record<string, never>;

export function RasterPathSimulation(_props: RasterPathSimulationProps): JSX.Element {
  const program = useMemo(() => generateCircleRasterGCode(RASTER_STEPS), []);

  return (
    <GCodePathSimulation
      fixedProgram={program}
      hideControls
      label="Play to see the raster path."
      segmentDurationMs={10}
    />
  );
}

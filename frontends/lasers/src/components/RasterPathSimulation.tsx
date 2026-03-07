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

  for (let row = 0; row <= steps; row++) {
    const y = row === 0 ? 0 : row === steps ? COORD_MAX : roundCoord(row * step);
    const leftToRight = row % 2 === 0;

    if (row > 0) {
      const prevLeftToRight = (row - 1) % 2 === 0;
      const endX = prevLeftToRight ? COORD_MAX : 0;
      const startX = leftToRight ? 0 : COORD_MAX;
      commands.push({ type: 'M5' });
      commands.push({ type: 'G1', x: endX, y });
      if (endX !== startX) {
        commands.push({ type: 'M5' });
        commands.push({ type: 'G1', x: startX, y });
      }
    }

    const xValues = leftToRight
      ? Array.from({ length: steps + 1 }, (_, i) => (i === 0 ? 0 : i === steps ? COORD_MAX : roundCoord(i * step)))
      : Array.from({ length: steps + 1 }, (_, i) => (i === 0 ? COORD_MAX : i === steps ? 0 : roundCoord((steps - i) * step)));

    if (row > 0) {
      commands.push({ type: 'M5' });
      commands.push({ type: 'G1', x: xValues[0], y });
      for (let i = 1; i < xValues.length; i++) {
        const x = xValues[i];
        commands.push(insideCircle(x, y) ? { type: 'M3' } : { type: 'M5' });
        commands.push({ type: 'G1', x, y });
      }
    } else {
      for (const x of xValues) {
        commands.push(insideCircle(x, y) ? { type: 'M3' } : { type: 'M5' });
        commands.push({ type: 'G1', x, y });
      }
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

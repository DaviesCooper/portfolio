import { Command } from "./command";
import { starVertices } from "./consts";

/** Map value in [min, max] to [0, 1]. Slider convention: 0 = max (slow), 1 = min (fast). */
export const normalize = (min: number, max: number, value: number) =>
  (max - value) / (max - min);

/** Map n in [0, 1] to value in [min, max]. Same convention: 0 → max, 1 → min. */
export const denormalize = (min: number, max: number, n: number) =>
  max - (max - min) * n;


export const coordInStar = (x: number, y: number): boolean => {
  let inside = false;
  const n = starVertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = starVertices[i];
    const [xj, yj] = starVertices[j];
    if (yi === yj) continue; // skip horizontal edge to avoid division by zero
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

/** Build a (resolution+1) x (resolution+1) grid: true = inside star, false = outside. */
export const generateBooleanMap = (resolution: number): boolean[][] => {
  const grid: boolean[][] = [];
  for (let iy = 0; iy <= resolution; iy++) {
    grid[iy] = Array(resolution + 1).fill(false);
    for (let ix = 0; ix <= resolution; ix++) {
      const cx = (ix / resolution) * 100;
      const cy = (iy / resolution) * 100;
      grid[iy][ix] = coordInStar(cx, cy);
    }
  }
  return grid;
};

/** Run-length encode the boolean grid as on/off + goto commands in line by line order order. */
export const generateCommandsFromCoords = (resolution: number): Command[] => {
  const coords = generateBooleanMap(resolution);

  let currentState = coords[0][0];
  const commands: Command[] = [];
  commands.push(currentState ? { type: 'on' } : { type: 'off' });
  for (let iy = 0; iy <= coords.length - 1; iy++) {
    // Even rows: left to right (ix 0..resolution). Odd rows: right to left (ix resolution..0).
    for (let ix = 0; ix <= coords[iy].length - 1; ix++) {
      if (coords[iy][ix] !== currentState) {

        if (iy % 2 === 0) {
          commands.push(currentState ? { type: 'on' } : { type: 'off' });
          currentState = !currentState;
          commands.push({ type: "goto", x: (ix / resolution) * 100, y: (iy / resolution) * 100 });
        }
        else {
          commands.push(currentState ? { type: 'on' } : { type: 'off' });
          currentState = !currentState;
          commands.push({ type: "goto", x: ((((coords.length - ix)) / resolution) * 100) + 1, y: (iy / resolution) * 100 });
        }
      }
    }
    commands.push({ type: "off" });
    if (iy % 2 === 0) {
      commands.push({ type: "goto", x: 99, y: (iy / resolution) * 100 });
      commands.push({ type: "goto", x: 99, y: ((iy + 1) / resolution) * 100 });
    }
    else {
      commands.push({ type: "goto", x: 1, y: (iy / resolution) * 100 });
      commands.push({ type: "goto", x: 1, y: ((iy + 1) / resolution) * 100 });
    }
  }
  return commands;
};
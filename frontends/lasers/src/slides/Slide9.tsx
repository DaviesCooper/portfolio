import { useEffect, useMemo, useState } from 'react';
import type { SlideComponentProps } from '../lib';
import type { Command } from '../lib/command';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { Slider } from '../components/controls/Slider';
import { Gradient } from '../lib/gradient';
import { defineSlide } from './defineSlide';
import { BurnVariables } from '../lib/burnVariables';
import { useLaserTool } from '../context/LaserToolContext';

const defaultVariables: BurnVariables = { power: 4, radius: .2, radialFalloff: 4 };

/** Star vertices from Slide7 (same polygon), in path order. */
const STAR_VERTICES: [number, number][] = [
  [50, 5], [39, 35], [7, 36], [33, 56], [24, 86], [50, 68], [76, 86], [67, 56], [93, 36], [61, 35],
];

const coordInStar = (x: number, y: number): boolean => {
  let inside = false;
  const n = STAR_VERTICES.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = STAR_VERTICES[i];
    const [xj, yj] = STAR_VERTICES[j];
    if (yi === yj) continue; // skip horizontal edge to avoid division by zero
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

/** Build a (resolution+1) x (resolution+1) grid: true = inside star, false = outside. */
const generateBooleanMap = (resolution: number): boolean[][] => {
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
const generateCommandsFromCoords = (resolution: number): Command[] => {
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


const ANIMATION_SPEED_MIN_MS = 160;
const ANIMATION_SPEED_MAX_MS = 8000;
/** Slider 0–1 mapped exponentially so high speeds don’t spike: 0 = slow (8s), 1 = fast but watchable (80ms per full width). */
const msFromNormalized = (n: number) =>
  ANIMATION_SPEED_MIN_MS * Math.pow(ANIMATION_SPEED_MAX_MS / ANIMATION_SPEED_MIN_MS, 1 - n);
const normalizedFromMs = (ms: number) =>
  1 - Math.log(ms / ANIMATION_SPEED_MIN_MS) / Math.log(ANIMATION_SPEED_MAX_MS / ANIMATION_SPEED_MIN_MS);

function Slide9(_props: SlideComponentProps): JSX.Element {
  const [animationSpeedMs, setAnimationSpeedMs] = useState(4000);
  const [power, setPower] = useState(defaultVariables.power);
  const [resolution, setResolution] = useState(25);
  const [commands, setCommands] = useState<Command[]>(generateCommandsFromCoords(resolution));
  const { tool} = useLaserTool();

  const mapPower = (power: number) => {
    setPower(power * 10);
  };

  useEffect(() => {
    setCommands(generateCommandsFromCoords(resolution));
  }, [resolution]);

  const variables = useMemo(
    () => ({ ...defaultVariables, power, animationSpeedMs }),
    [power, animationSpeedMs]
  );
  const colorPalette = useMemo(() => {
    const g = new Gradient();
    g.addColorKey(0, { r: 0.55, g: 0.35, b: 0.2 }); /* wood brown */
    g.addColorKey(0.1, { r: 0, g: 0, b: 0 }); /* black */
    g.addColorKey(1, { r: 1, g: 1, b: 1 }); /* white */
    return g;
  }, []);

  const canvas = (
    <BurnVisualization
      variables={variables}
      commands={commands}
      colorPalette={colorPalette}
    />
  );
  const speedSliderProps = {
    label: 'Speed',
    minValue: 0,
    maxValue: 1,
    step: 0.05,
    value: normalizedFromMs(animationSpeedMs),
    onChange: (n: number) => setAnimationSpeedMs(msFromNormalized(n)),
    formatValue: (v: number) => v.toFixed(2),
    'aria-label': 'Laser speed (0 = slow, 1 = fast)',
  };

  const resolutionSliderProps = {
    label: 'Resolution',
    minValue: 25,
    maxValue: 100,
    step: 5,
    value: resolution,
    onChange: (n: number) => setResolution(n),
    formatValue: (v: number) => v.toFixed(0),
    'aria-label': 'Resolution (pixels per inch)',
  };

  const powerSliderProps = {
    label: 'Power',
    minValue: 0,
    maxValue: 1,
    step: 0.05,
    value: power / 10,
    onChange: (n: number) => mapPower(n),
    formatValue: (v: number) => v.toFixed(2),
    'aria-label': 'Laser power',
  };

  const controls = (
    <>
      <Slider {...speedSliderProps} />
      <Slider {...powerSliderProps} />
      <Slider {...resolutionSliderProps} />
    </>
  );

  const resolutionDict = {
    'xtool': {
      name: "XTool",
      resolution: 762,
    },
    'thunder': {
      name: "Thunder",
      resolution: 500,
    },
    'trotec': {
      name: "Trotec",
      resolution: 1000,
    },
  }


  return (
    <ColumnSlide
      left={
        <>
          <p>
            When following a path, the laser will move in small increments. The smaller the
            increments, the more accurate the path will be. The more increments, the longer it will
            take to complete the path. The maximum resolution is limited by the machine itself.
            These steps are typically referred to as pixels per inch (PPI), or dots per inch (DPI).
          </p>
          <p>
            The {resolutionDict[tool].name} has a maximum resolution of {resolutionDict[tool].resolution} ppi.
          </p>
        </>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Change the resolution to see the effect on the image.</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide9, {
  id: 'raster-path',
  title: 'Principles of Laser CNC Machines',
});

import { useEffect, useMemo, useState } from 'react';
import type { Command } from '../lib/command';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { Slider } from '../components/controls/Slider';
import { defineSlide } from './defineSlide';
import { BurnVariables } from '../lib/burnVariables';
import { useLaserTool } from '../context/LaserToolContext';
import { denormalize, generateCommandsFromCoords, normalize } from '../lib/math';
import { woodGradient } from '../lib/consts';

const defaultVariables: BurnVariables = { power: 5, radius: .2, radialFalloff: 4 };
const ANIMATION_SPEED_MIN_MS = 80;
const ANIMATION_SPEED_MAX_MS = 4000;


function Slide9(): JSX.Element {
  const [animationSpeedMs, setAnimationSpeedMs] = useState(2050);
  const [power, setPower] = useState(defaultVariables.power);
  const [resolution, setResolution] = useState(60);
  const [commands, setCommands] = useState<Command[]>(generateCommandsFromCoords(resolution));
  const { tool } = useLaserTool();

  useEffect(() => {
    setCommands(generateCommandsFromCoords(resolution));
  }, [resolution]);

  const variables = useMemo(
    () => ({ ...defaultVariables, power, animationSpeedMs }),
    [power, animationSpeedMs]
  );


  const canvas = (
    <BurnVisualization
      variables={variables}
      commands={commands}
      colorPalette={woodGradient}
    />
  );
  const speedSliderProps = {
    label: 'Speed',
    minValue: 0,
    maxValue: 1,
    step: 0.05,
    value: normalize(ANIMATION_SPEED_MIN_MS, ANIMATION_SPEED_MAX_MS, animationSpeedMs),
    onChange: (n: number) => setAnimationSpeedMs(denormalize(ANIMATION_SPEED_MIN_MS, ANIMATION_SPEED_MAX_MS, n)),
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
    onChange: (n: number) => setPower(n * 10),
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
  id: 'raster-path-resolution',
  title: 'Principles of Laser CNC Machines',
});

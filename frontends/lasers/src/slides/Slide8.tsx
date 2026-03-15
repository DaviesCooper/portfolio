import { useMemo, useState } from 'react';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { Slider } from '../components/controls/Slider';
import { defineSlide } from './defineSlide';
import { BurnVariables } from '../lib/burnVariables';
import { woodGradient } from '../lib/consts';
import { denormalize, generateCommandsFromCoords, normalize } from '../lib/math';

const defaultVariables: BurnVariables = { power: 5, radius: .2, radialFalloff: 4 };
const ANIMATION_SPEED_MIN_MS = 160;
const ANIMATION_SPEED_MAX_MS = 8000;

function Slide8(): JSX.Element {
  const [animationSpeedMs, setAnimationSpeedMs] = useState(1110);
  const [power, setPower] = useState(defaultVariables.power);
  const commands = useMemo(() => generateCommandsFromCoords(50), []);

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
    </>
  );

  return (
    <ColumnSlide
      left={
        <>
          <p>
            Try to think of a path that can draw a portrait. Like modern printers, the best
            approach is to cover every point of the image on the material. These paths are not the
            most efficient way to draw an image, but they are guaranteed to be as accurate as the
            machine can make them. We create a path that covers every pixel in the image and turn
            the laser on and off depending on the color of the pixel.
          </p>
          <p>This is called a raster path.</p>
        </>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Raster the image onto the path.</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide8, {
  id: 'raster-path',
  title: 'Principles of Laser CNC Machines',
});

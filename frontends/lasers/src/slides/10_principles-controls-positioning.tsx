import { useMemo, useState } from 'react';
import type { Command } from '../lib/command';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { CommandList } from '../components/controls/CommandList';
import { Slider } from '../components/controls/Slider';
import { defineSlide } from './defineSlide';
import { defaultCommands, woodGradient } from '../lib/consts';
import { normalize, denormalize } from '../lib/math';

const defaultVariables = { power: 4, radius: .2, radialFalloff: 4 };
const ANIMATION_SPEED_MIN_MS = 50;
const ANIMATION_SPEED_MAX_MS = 2000;

function Slide7(): JSX.Element {
  const [commands, setCommands] = useState<Command[]>(defaultCommands);
  const [animationSpeedMs, setAnimationSpeedMs] = useState(1025);
  const variables = useMemo(
    () => ({ ...defaultVariables, animationSpeedMs }),
    [animationSpeedMs]
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

  const controls = (
    <>
      <Slider {...speedSliderProps} />
      <CommandList value={commands} onChange={setCommands} aria-label="G-code command list" />
    </>
  );

  return (
    <ColumnSlide
      left={
        <>
          <p>
            We can automate the laser by giving it a series of commands to follow. These commands
            are called G-code. The most basic commands are essentially &quot;go to this
            position&quot;, &quot;turn the laser on or off&quot;, &quot;move with this speed&quot;,
            and &quot;use this much power&quot;. Additional commands exist but they are more
            specialized.
          </p>
          <p>This is called a vector path.</p>
        </>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Drag commands into the list, then play to run the path.</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide7, {
  id: 'principles-controls-positioning',
  title: 'Principles of Laser CNC Machines',
});

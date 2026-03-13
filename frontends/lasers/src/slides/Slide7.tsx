import { useMemo, useState } from 'react';
import type { SlideComponentProps } from '../lib';
import type { Command } from '../lib/command';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { CommandList } from '../components/controls/CommandList';
import { Slider } from '../components/controls/Slider';
import { Gradient } from '../lib/gradient';
import { defineSlide } from './defineSlide';

const defaultVariables = { power: 4, radius: .2, radialFalloff: 4 };
/** Star: 10 segments, outer/inner alternating (center 50,50; outer r 45, inner r 18). No overlapping lines. */
const defaultCommands: Command[] = [
  { type: 'goto', x: 50, y: 5 },
  { type: 'on', x: 50, y: 5 },
  { type: 'goto', x: 39, y: 35 },
  { type: 'goto', x: 7, y: 36 },
  { type: 'goto', x: 33, y: 56 },
  { type: 'goto', x: 24, y: 86 },
  { type: 'goto', x: 50, y: 68 },
  { type: 'goto', x: 76, y: 86 },
  { type: 'goto', x: 67, y: 56 },
  { type: 'goto', x: 93, y: 36 },
  { type: 'goto', x: 61, y: 35 },
  { type: 'goto', x: 50, y: 5 },
  { type: 'off', x: 50, y: 5 },
];

const ANIMATION_SPEED_MIN_MS = 50;
const ANIMATION_SPEED_MAX_MS = 2000;
/** Slider uses 0–1; 0 = 400 ms, 1 = 50 ms */
const msFromNormalized = (n: number) => ANIMATION_SPEED_MAX_MS - (ANIMATION_SPEED_MAX_MS - ANIMATION_SPEED_MIN_MS) * n;
const normalizedFromMs = (ms: number) =>
  (ANIMATION_SPEED_MAX_MS - ms) / (ANIMATION_SPEED_MAX_MS - ANIMATION_SPEED_MIN_MS);

function Slide7(_props: SlideComponentProps): JSX.Element {
  const [commands, setCommands] = useState<Command[]>(defaultCommands);
  const [animationSpeedMs, setAnimationSpeedMs] = useState(1025);
  const variables = useMemo(
    () => ({ ...defaultVariables, animationSpeedMs }),
    [animationSpeedMs]
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
          buttons={null}
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

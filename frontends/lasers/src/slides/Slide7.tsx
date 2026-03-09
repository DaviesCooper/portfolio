import { useMemo, useState } from 'react';
import type { SlideComponentProps } from '../lib';
import type { Command } from '../lib/command';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { CommandList } from '../components/controls/CommandList';
import { Gradient } from '../lib/gradient';
import { defineSlide } from './defineSlide';

const defaultVariables = { power: 60, radius: 0.4, radialFalloff: 2, animationSpeedMs: 175 };

function Slide7(_props: SlideComponentProps): JSX.Element {
  const [commands, setCommands] = useState<Command[]>([]);
  const colorPalette = useMemo(() => {
    const g = new Gradient();
    g.addColorKey(0, { r: 0.1, g: 0.05, b: 0.05 });
    g.addColorKey(0.35, { r: 0.4, g: 0.15, b: 0.05 });
    g.addColorKey(0.7, { r: 0.9, g: 0.3, b: 0.1 });
    g.addColorKey(1, { r: 1, g: 1, b: 1 });
    return g;
  }, []);

  const canvas = (
    <BurnVisualization
      variables={defaultVariables}
      commands={commands}
      colorPalette={colorPalette}
    />
  );
  const controls = (
    <CommandList value={commands} onChange={setCommands} aria-label="G-code command list" />
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

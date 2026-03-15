import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { useMemo, useState } from 'react';
import { useLaserTool } from '../context/LaserToolContext';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { PillToggle } from '../components/controls/PillToggle';
import { metalGradient, woodGradient } from '../lib/consts';

const defaultVariables = { power: .6, radius: .8, radialFalloff: 4 };

function Slide5(): JSX.Element {
  const selectedTool = useLaserTool().tool;

  const variables = useMemo(
    () => ({ ...defaultVariables }),
    []);
    const [isWood, setIsWood] = useState(true);
    const colorPalette = useMemo(() => isWood ? woodGradient : metalGradient, [isWood]);

  const canvas = (
    <BurnVisualization
      variables={variables}
      colorPalette={colorPalette}
    />
  );

  const controls = (<PillToggle value={isWood} onChange={setIsWood} options={['MOPA IR Laser', 'Blue Light']} aria-label="Select material" />
  );

  return (
    <ColumnSlide
      left={
        <p>
          A laser cnc works by using a laser to deposit energy into some material. As the laser
          deposits energy, the material ablates, or burns away. Over time the material will burn.
          This will cause for the material to darken, and with enough exposure, eventually burn
          through.
        </p>

      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Drag to simulate a laser being used on a material.</p>}
          controls={selectedTool === 'xtool' ? controls : null}
        />
      }
    />
  );
}

export default defineSlide(Slide5, {
  id: 'principles',
  title: 'Principles of Laser CNC Machines',
});
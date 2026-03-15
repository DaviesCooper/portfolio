import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { useMemo, useState } from 'react';
import { Gradient } from '../lib/gradient';
import { useLaserTool } from '../context/LaserToolContext';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { PillToggle } from '../components/controls/PillToggle';

const defaultVariables = { power: .6, radius: .8, radialFalloff: 4 };

// Anodized-metal look: base steel then oxide colors by thickness (straw → purple → blue → cobalt → white)
const metalGradient = new Gradient();
metalGradient.addColorKey(0, { r: 0.75, g: 0.75, b: 0.75 }); /* base steel — shiny/white */
metalGradient.addColorKey(0.15, { r: 0.85, g: 0.72, b: 0.35 });  /* straw yellow */
metalGradient.addColorKey(0.35, { r: 0.58, g: 0.35, b: 0.95 }); /* neon purple / violet */
metalGradient.addColorKey(0.55, { r: 0.25, g: 0.45, b: 0.95 }); /* blue */
metalGradient.addColorKey(0.75, { r: 0.15, g: 0.28, b: 0.65 }); /* cobalt blue */
metalGradient.addColorKey(1, { r: 1, g: 1, b: 1 });             /* white (hot / thick oxide) */

const woodGradient = new Gradient();
woodGradient.addColorKey(0, { r: 0.55, g: 0.35, b: 0.2 }); /* wood brown */
woodGradient.addColorKey(0.1, { r: 0, g: 0, b: 0 }); /* black */
woodGradient.addColorKey(1, { r: 1, g: 1, b: 1 }); /* white */



function Slide5(_props: SlideComponentProps): JSX.Element {

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
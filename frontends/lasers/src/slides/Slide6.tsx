import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import { Gradient } from '../lib/gradient';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { useLaserTool } from '../context/LaserToolContext';
import { useMemo, useState } from 'react';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { PillToggle } from '../components/controls/PillToggle';
import { Slider } from '../components/controls/Slider';


const defaultVariables = { power: 5, radius: .4, radialFalloff: 4 };

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


function Slide6({ tool }: SlideComponentProps): JSX.Element {

  const selectedTool = useLaserTool().tool;


  const [power, setPower] = useState(defaultVariables.power);
  const [isWood, setIsWood] = useState(true);
  const colorPalette = useMemo(() => isWood ? woodGradient : metalGradient, [isWood]);

  const canvas = (
    <BurnVisualization
      variables={{ ...defaultVariables, power }}
      colorPalette={colorPalette}
    />
  );

  const mapPower = (power: number) => {
    setPower(power * 10);
  };

  const controls = (
    <>
      <Slider
        label="Power"
        minValue={0}
        maxValue={1}
        step={0.05}
        value={power / 10}
        onChange={mapPower}
        aria-label="Laser power"
      />
      {selectedTool == "xtool" &&
        <PillToggle value={isWood} onChange={setIsWood} options={['MOPA IR Laser', 'Blue Light']} aria-label="Select material" />}
    </>
  );


  return (
    <ColumnSlide
      left={
        <>
          <p>
            We can control how much energy is deposited into the material by controlling the power
            of the laser, or by controlling the speed of the laser.
          </p>
          {tool === 'xtool' && (
            <p>
              In addition we can control the type of laser we use, as well as the frequency of the
              laser. This is only useful for XTool, as it is the only laser that can be switched
              between types. The types of lasers the XTool can use are IR and Blue Light. IR lasers
              are used for metal. Blue light lasers are used for wood and plastic.
            </p>
          )}
        </>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Drag to simulate a laser being used on a material.</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide6, {
  id: 'principles-controls',
  title: 'Principles of Laser CNC Machines',
});

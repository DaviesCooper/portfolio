import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { useLaserTool } from '../context/LaserToolContext';
import { useMemo, useState } from 'react';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { PillToggle } from '../components/controls/PillToggle';
import { Slider } from '../components/controls/Slider';
import { metalGradient, woodGradient } from '../lib/consts';

const defaultVariables = { power: 5, radius: .4, radialFalloff: 4 };

function Slide6(): JSX.Element {
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

  const controls = (
    <>
      <Slider
        label="Power"
        minValue={0}
        maxValue={1}
        step={0.05}
        value={power / 10}
        onChange={(n) => setPower(n * 10)}
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
          {selectedTool === 'xtool' && (
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

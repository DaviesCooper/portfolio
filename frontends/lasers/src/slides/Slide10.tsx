import { useMemo, useState } from 'react';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { Slider } from '../components/controls/Slider';
 import { defineSlide } from './defineSlide';
import { BurnVariables } from '../lib/burnVariables';
import { useLaserTool } from '../context/LaserToolContext';
import { woodGradient } from '../lib/consts';

const defaultVariables: BurnVariables = { power: 5, radius: .2, radialFalloff: 8 };

function Slide10(): JSX.Element {
  const { tool} = useLaserTool();
  const [power, setPower] = useState(defaultVariables.power);
  const [radius, setRadius] = useState(defaultVariables.radius);

  const variables = useMemo(
    () => ({ ...defaultVariables, power, radius }),
    [power, radius]
  );

  const canvas = (
    <BurnVisualization
      variables={variables}
      colorPalette={woodGradient}
    />
  );

  const airAssistSliderProps = {
    label: 'Air',
    minValue: 0,
    maxValue: 1,
    step: 0.05,
    value: radius - 0.2,
    onChange: (n: number) => setRadius(n + 0.2),
    formatValue: (v: number) => v.toFixed(2),
    'aria-label': 'Air assist radius',
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
      <Slider {...powerSliderProps} />
      <Slider {...airAssistSliderProps} />
    </>
  );

  const toolName = tool === 'xtool' ? 'XTool' : tool === 'trotec' ? 'Trotec' : 'Thunder';
  return (
    <ColumnSlide
      left={
        <p>
          Fire consumes oxygen to burn. The more oxygen we use while the laser is burning, the
          stringer the burning effect will be. When cutting through material, we want to use as much
          oxygen as possible in order to increase the effectiveness of the laser. When engraving, we
          want to use as little oxygen as possible in order to increase the precision of the
          engraving. If we supply too much oxygen the engraving will &quot;blur&quot; as the
          burning spreads more than is intended.
          {(tool === 'xtool' || tool === 'trotec') && (
            <p>
              The {toolName} automatically sets its own ait-assist based on the sattings you use.
            </p>
          )}

        </p>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Change the amount of air assist to see the effect on the image.</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide10, {
  id: 'principles-controls-air-assist',
  title: 'Principles of Laser CNC Machines',
});

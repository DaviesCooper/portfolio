import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import { Slider } from '../components/controls/Slider';
import { useMemo, useState } from 'react';
import { BurnVariables } from '../lib/burnVariables';
import { PillToggle } from '../components/controls/PillToggle';
import { useLaserTool } from '../context/LaserToolContext';
import { metalGradient, woodGradient } from '../lib/consts';
import { BurnVisualization } from '../components/subComponents/BurnVisualization';
import { SimulationLayout } from '../components/layouts/SimulationLayout';

const defaultVariables: BurnVariables = { power: 5, radius: .6, radialFalloff: 6 };

/** Sigmoid y = 1 / (1 + e^(-k*(x - 0.5))) for x in [0,1], steepness k. */
function sigmoid(x: number, k = 16): number {
  return 1 / (1 + Math.exp(-k * (x - 0.5)));
}

/** Inverse of sigmoid: slider position from normalized power in [0,1]. */
function inverseSigmoid(y: number, k = 16): number {
  const clamped = Math.max(1e-6, Math.min(1 - 1e-6, y));
  return 0.5 - Math.log((1 - clamped) / clamped) / k;
}

function powerFromSlider(n: number): number {
  return 10 * sigmoid(Math.max(0, Math.min(1, n)));
}
function sliderFromPower(power: number): number {
  return inverseSigmoid(Math.max(0, Math.min(1, power / 10)));
}

function SigmoidGraph(): JSX.Element {
  const w = 280;
  const h = 120;
  const pad = { left: 36, right: 12, top: 8, bottom: 28 };
  const x = (t: number) => pad.left + t * (w - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - v) * (h - pad.top - pad.bottom);
  const pts: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    pts.push(`${x(t).toFixed(2)},${y(sigmoid(t)).toFixed(2)}`);
  }
  const pathD = `M ${pts.join(' L ')}`;

  return (
    <figure className="sigmoid-graph" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto" className="sigmoid-graph-svg">
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="currentColor" strokeWidth="0.8" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="currentColor" strokeWidth="0.8" />
        <text x={w / 2 - 20} y={h - 4} textAnchor="middle" fontSize="10" fill="currentColor">Power</text>
        <text x={8} y={h / 2 + 4} textAnchor="middle" fontSize="10" fill="currentColor" transform={`rotate(-90, 8, ${h / 2})`}>Darkness</text>
      </svg>
    </figure>
  );
}

function Slide10_2(): JSX.Element {
  const [power, setPower] = useState(defaultVariables.power);
  const selectedTool = useLaserTool().tool;
  const [isWood, setIsWood] = useState(true);

  const colorPalette = useMemo(() => isWood ? woodGradient : metalGradient, [isWood]);

  const controls = (
    <>
      <Slider
        label="Power"
        minValue={0}
        maxValue={1}
        step={0.05}
        value={sliderFromPower(power)}
        onChange={(n) => setPower(powerFromSlider(n))}
        formatValue={(v) => v.toFixed(2)}
        aria-label="Laser power"
      />
      {selectedTool == "xtool" &&
        <PillToggle value={isWood} onChange={setIsWood} options={['MOPA IR Laser', 'Blue Light']} aria-label="Select material" />}
    </>
  );

  const canvas = (
    <BurnVisualization
      variables={{ ...defaultVariables, power }}
      colorPalette={colorPalette}
    />
  );

  return (
    <ColumnSlide
      left={
        <>
          <p>
            When doing an engraving there are many variables that affect the quality of the engraving.
            The material we are engraving on, the power of the laser, the speed of the laser, the amount of air assist, and the resolution of the laser are all important factors.
            To add to that, a material may not be perfectly homogenous and may have variations in thickness, as well as density.
            Unfortunately, this makes it so that simply increasing the power of the laser will not always result in a "darker" engrave.
          </p>
          <SigmoidGraph />
        </>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Change the power of the laser to see the effect on the image.</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide10_2, {
  id: 'principles-controls-sigmoid',
  title: 'Principles of Laser CNC Machines',
});

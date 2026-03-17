import { useState } from 'react';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { KerfSimulation, FOCAL_LENGTH_MIN, FOCAL_LENGTH_MAX, getKerfFocusLabel } from '../components/subComponents/KerfSimulation';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { Slider } from '../components/controls/Slider';
import { useLaserTool } from '../context/LaserToolContext';
import { defineSlide } from './defineSlide';

function Slide11(): JSX.Element {
  const { tool } = useLaserTool();
  const isXTool = tool === 'xtool';

  const [headX, setHeadX] = useState(160);
  const [headY, setHeadY] = useState(75);
  const [focalLengthNorm, setFocalLengthNorm] = useState(50);
  const [beamAngleDeg, setBeamAngleDeg] = useState(0);

  const handleHeadChange = (x: number, y: number) => {
    setHeadX(x);
    setHeadY(y);
  };

  const focalLengthMm = Math.round(
    FOCAL_LENGTH_MIN + (FOCAL_LENGTH_MAX - FOCAL_LENGTH_MIN) * (focalLengthNorm / 100)
  );

  const controls = (
    <>
      <Slider
        label="Focal length"
        minValue={0}
        maxValue={100}
        step={1}
        value={focalLengthNorm}
        onChange={setFocalLengthNorm}
        formatValue={() => `${focalLengthMm} mm`}
        aria-label="Focal length"
      />
      {isXTool && (
        <Slider
          label="Beam angle (galvo)"
          minValue={-30}
          maxValue={30}
          step={1}
          value={beamAngleDeg}
          onChange={setBeamAngleDeg}
          formatValue={(v) => `${v}°`}
          aria-label="Beam angle"
        />
      )}
    </>
  );

  const canvas = (
    <KerfSimulation
      headX={headX}
      headY={headY}
      focalLengthNorm={focalLengthNorm}
      beamAngleDeg={beamAngleDeg}
      isXTool={isXTool}
      onHeadChange={handleHeadChange}
    />
  );

  const focusLabel = getKerfFocusLabel(headX, headY, focalLengthNorm, beamAngleDeg, isXTool);

  return (
    <ColumnSlide
      left={
        <p>
          Kerf is the width of the material that is removed by any process. On a table saw, it is
          the width of the saw blade. On a laser, it is the width of the laser beam. However, the
          laser beam does not have a fixed size, it depends on the focal length of the lens the
          laser is pulsed through. Depending on how the laser is focused, the kerf will be
          different.
        </p>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Adjust the focal length and beam angle to see the effect on the kerf. {focusLabel}</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide11, {
  id: 'principles-controls-kerf',
  title: 'Principles of Laser CNC Machines',
});

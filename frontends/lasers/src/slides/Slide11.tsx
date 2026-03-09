import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { KerfSimulation } from '../components/KerfSimulation';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { defineSlide } from './defineSlide';

function Slide11(_props: SlideComponentProps): JSX.Element {
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
        <KerfSimulation>{(parts) => <SimulationLayout {...parts} />}</KerfSimulation>
      }
    />
  );
}

export default defineSlide(Slide11, {
  id: 'principles-controls-kerf',
  title: 'Principles of Laser CNC Machines',
});

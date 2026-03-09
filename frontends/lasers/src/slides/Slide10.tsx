import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide10(_props: SlideComponentProps): JSX.Element {
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
        </p>
      }
      right={
        <p>(Air assist simulation placeholder)</p>
      }
    />
  );
}

export default defineSlide(Slide10, {
  id: 'principles-controls-air-assist',
  title: 'Principles of Laser CNC Machines',
  whenTool: 'thunder',
});

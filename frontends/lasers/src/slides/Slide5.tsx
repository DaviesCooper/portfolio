import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide5(_props: SlideComponentProps): JSX.Element {
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
        <p>(Burn simulation placeholder)</p>
      }
    />
  );
}

export default defineSlide(Slide5, {
  id: 'principles',
  title: 'Principles of Laser CNC Machines',
});

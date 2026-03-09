import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide14(_props: SlideComponentProps): JSX.Element {
  return (
    <ColumnSlide
      left={
        <div>
          <p>TODO</p>
        </div>
      }
      right={<div />}
    />
  );
}

export default defineSlide(Slide14, {
  id: 'machine-specific',
  title: 'Xtool, Trotec, or Thunder',
});

import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide12(_props: SlideComponentProps): JSX.Element {
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

export default defineSlide(Slide12, {
  id: 'safety',
  title: 'Safety',
});

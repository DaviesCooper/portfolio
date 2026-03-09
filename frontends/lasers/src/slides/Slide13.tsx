import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide13(_props: SlideComponentProps): JSX.Element {
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

export default defineSlide(Slide13, {
  id: 'protospace-etiquette',
  title: 'Protospace Etiquette',
});

import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide7(_props: SlideComponentProps): JSX.Element {
  return (
    <ColumnSlide
      left={
        <>
          <p>
            We can automate the laser by giving it a series of commands to follow. These commands
            are called G-code. The most basic commands are essentially &quot;go to this
            position&quot;, &quot;turn the laser on or off&quot;, &quot;move with this speed&quot;,
            and &quot;use this much power&quot;. Additional commands exist but they are more
            specialized.
          </p>
          <p>This is called a vector path.</p>
        </>
      }
      right={
        <p>(G-code path simulation placeholder)</p>
      }
    />
  );
}

export default defineSlide(Slide7, {
  id: 'principles-controls-positioning',
  title: 'Principles of Laser CNC Machines',
});

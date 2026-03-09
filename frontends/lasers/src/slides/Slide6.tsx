import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide6({ tool }: SlideComponentProps): JSX.Element {
  return (
    <ColumnSlide
      left={
        <>
          <p>
            We can control how much energy is deposited into the material by controlling the power
            of the laser, or by controlling the speed of the laser.
          </p>
          {tool === 'xtool' && (
            <p>
              In addition we can control the type of laser we use, as well as the frequency of the
              laser. This is only useful for XTool, as it is the only laser that can be switched
              between types. The types of lasers the XTool can use are IR and Blue Light. IR lasers
              are used for metal. Blue light lasers are used for wood and plastic.
            </p>
          )}
        </>
      }
      right={<p>(Principles with controls placeholder)</p>}
    />
  );
}

export default defineSlide(Slide6, {
  id: 'principles-controls',
  title: 'Principles of Laser CNC Machines',
});

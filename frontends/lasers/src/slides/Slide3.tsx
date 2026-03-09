import type { SlideComponentProps } from '../lib';
import { CenterSlide } from '../components/layouts/CenterSlide';
import { defineSlide } from './defineSlide';

function Slide3(_props: SlideComponentProps): JSX.Element {
  return (
    <CenterSlide>
      <ul>
        <li>Vetted vs. Unvetted Members</li>
        <li>Recording During Class</li>
        <li>
          <a href="https://drive.google.com/drive/folders/0By-vvp6fxFekaHBreG1Id2dEb00?resourcekey=0-SUrE5drsOBu9F0jGrk1fZQ&usp=drive_link">
            Other Slides
          </a>
        </li>
      </ul>
    </CenterSlide>
  );
}

export default defineSlide(Slide3, {
  id: 'housekeeping',
  title: 'Housekeeping',
});

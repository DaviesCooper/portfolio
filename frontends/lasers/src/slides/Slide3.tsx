import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import './Slide3.css';

function Slide3(): JSX.Element {
  return (
    <ColumnSlide
      left={
        <ul className="slide-bullet-list">
          <li>Vetted vs. Unvetted Members</li>
          <li>Recording During Class</li>
          <li>
            <a href="https://drive.google.com/drive/folders/0By-vvp6fxFekaHBreG1Id2dEb00?resourcekey=0-SUrE5drsOBu9F0jGrk1fZQ&usp=drive_link">
              Other Slides
            </a>
          </li>
        </ul>
      }
      right={null}
    />
  );
}

export default defineSlide(Slide3, {
  id: 'housekeeping',
  title: 'Housekeeping',
});

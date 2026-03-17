import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import './3_outline.css';

function Slide4(): JSX.Element {
  
  return (
    <ColumnSlide
      left={
        <div className="slide-outline-wrap">
          <div className="slide-outline-row">
            <ul className="slide-outline">
              <li>Safety</li>
              <li>Principles of Laser CNC Machines</li>
              <li>Protospace Etiquette</li>
              <li>Safety Again</li>
            </ul>
            <span className="slide-outline-duration">1 Hour</span>
          </div>
          <hr className="slide-outline-divider" />
          <div className="slide-outline-row">
            <ul className="slide-outline">
              <li>Live Demo</li>
            </ul>
            <span className="slide-outline-duration">1 Hour</span>
          </div>
        </div>
      }
      right={null}
    />
  );
}

export default defineSlide(Slide4, {
  id: 'outline',
  title: 'Class outline',
});

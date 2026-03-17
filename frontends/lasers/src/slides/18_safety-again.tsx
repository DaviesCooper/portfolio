import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import './18_safety-again.css';

function Slide15(): JSX.Element {
  return (
    <ColumnSlide
      left={
        <div>
          <p>Never leave the laser cutter unattended while it is running.</p>
          <ul>
            <li>If the laser cutter is left unattended, you have a responsibility to stop the machine.</li>
          </ul>
          <br />
          <p>Never put chlorine, or unknown materials in the laser cutter.</p>
        </div>
      }
      right={
        <div className="slide15-fire-list-wrap">
          <div>
            <p>If a fire starts:</p>
            <ul>
              <li>Open the lid.</li>
              <li>Blow on it.</li>
              <li>Spray it with water.</li>
              <li>Use the CO2 extinguisher under the desk.</li>
              <li>Use the Non-CO2 extinguisher by the bathrooms.</li>
              <li>Call 911.</li>
            </ul>
          </div>
          <div className="slide15-severity-arrow" aria-hidden>
            <div className="slide15-severity-arrow-line" />
            <span className="slide15-severity-label">increasing severity</span>
          </div>
        </div>
      }
    />
  );
}

export default defineSlide(Slide15, {
  id: 'safety-again',
  title: 'Safety again',
});

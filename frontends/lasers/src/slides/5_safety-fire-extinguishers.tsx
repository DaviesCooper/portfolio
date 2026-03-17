import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import './5_safety-fire-extinguishers.css';

const BASE = import.meta.env.BASE_URL;

function Slide12d2(): JSX.Element {
  return (
    <ColumnSlide
      left={
        <>
          <p>Fire extinguishers are located in the following areas:</p>
          <ul>
            <li>Non-CO2 extinguisher near the washrooms.</li>
            <li>CO2 extinguisher by the lasers.</li>
          </ul>
        </>
      }
      right={
        <div className="slide-12d2-images">
          <div className="slide-12d2-img slide-12d2-img-front">
            <img
              src={`${BASE}fire-extinguisher-washrooms.jpg`}
              alt="Fire extinguisher near washrooms"
              draggable={false}
            />
          </div>
          <div className="slide-12d2-img slide-12d2-img-back">
            <img
              src={`${BASE}fire-extinguisher-trotec.jpg`}
              alt="Fire extinguisher at Trotec laser"
              draggable={false}
            />
          </div>
        </div>
      }
    />
  );
}

export default defineSlide(Slide12d2, {
  id: 'safety-fire-extinguishers',
  title: 'Safety',
});

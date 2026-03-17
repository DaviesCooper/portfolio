import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import './6_safety-chlorine.css';

const BASE = import.meta.env.BASE_URL;

function Slide12d3(): JSX.Element {
  return (
    <ColumnSlide
      left={
        <div>
          <p>Sublimating chlorine creates chlorine gas.</p>
          <p>Chlorine gas is:</p>
          <ul>
            <li>a toxic gas.</li>
            <li>a corrosive gas.</li>
            <li>a flammable gas.</li>
          </ul>
        </div>
      }
      right={
        <div className="slide-12d2-img slide-12d2-img-back slide-12d3-sds-img">
          <a
            href="https://www.behr.com/pro/products/safety-msds"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Safety Data Sheets at Behr"
          >
            <img
              src={`${BASE}sds-sheet.png`}
              alt="A Sample Safety Data Sheet"
              draggable={false}
            />
          </a>
        </div>
      }
    />
  );
}

export default defineSlide(Slide12d3, {
  id: 'safety-chlorine',
  title: 'Safety',
});

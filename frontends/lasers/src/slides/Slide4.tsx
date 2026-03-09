import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import './Slide4.css';

function Slide4({ tool }: SlideComponentProps): JSX.Element {
  const toolLabel = tool === 'xtool' ? 'XTool' : tool === 'trotec' ? 'Trotec' : 'Thunder';
  return (
    <ColumnSlide
      left={
        <div className="slide-outline-wrap">
          <div className="slide-outline-row">
            <ul className="slide-outline">
              <li>Principles of Laser CNC Machines</li>
              <li>Safety</li>
              <li>Protospace Etiquette</li>
              <li>{toolLabel} specifics</li>
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

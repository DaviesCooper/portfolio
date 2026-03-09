import type { SlideComponentProps } from '../lib';
import { CenterSlide } from '../components/layouts/CenterSlide';
import { MeasuredBrace } from '../components/MeasuredBrace';
import { defineSlide } from './defineSlide';

function Slide4({ tool }: SlideComponentProps): JSX.Element {
  const toolLabel = tool === 'xtool' ? 'XTool' : tool === 'trotec' ? 'Trotec' : 'Thunder';
  return (
    <CenterSlide>
      <div className="slide-outline-wrap">
        <MeasuredBrace label="1 hr">
          <ul className="slide-outline">
            <li>Principles of Laser CNC Machines</li>
            <li>Safety</li>
            <li>Protospace Etiquette</li>
            <li>{toolLabel} specifics</li>
            <li>Safety Again</li>
          </ul>
        </MeasuredBrace>
        <hr className="slide-outline-divider" />
        <MeasuredBrace label="1 hr">
          <ul className="slide-outline">
            <li>Live Demo</li>
          </ul>
        </MeasuredBrace>
      </div>
    </CenterSlide>
  );
}

export default defineSlide(Slide4, {
  id: 'outline',
  title: 'Class outline',
});

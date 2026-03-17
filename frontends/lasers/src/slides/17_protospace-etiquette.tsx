import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { useLaserTool } from '../context/LaserToolContext';
import { defineSlide } from './defineSlide';
import './17_protospace-etiquette.css';

function Slide13(): JSX.Element {

  const BASE = import.meta.env.BASE_URL;
  const { tool } = useLaserTool();
  const src = tool === 'xtool' ? `${BASE}lid-interlock.png` :
    tool === 'trotec' ? `${BASE}objects-in-trotec.jpg` :
      tool === 'thunder' ? `${BASE}chiller-tape.jpg` :
        undefined;


  return (
    <ColumnSlide
      left={
        <div>
          <p>Assume everyone who used the tool before you is intentionally trying to trick you.</p>
          <ul>
            <li>It is your responsibility to figure out how.</li>
          </ul>
          <br />
          <p>If you are acting in good faith, do not be afraid of experimenting.</p>
          <ul>
            <li>But also be respectful of others.</li>
          </ul>
        </div>
      }
      right={
        <img
          src={src}
          alt="Ways in which we can be tricked."
          draggable={false}
          className="slide-13-right-img"
        />
      }
    />
  );
}

export default defineSlide(Slide13, {
  id: 'protospace-etiquette',
  title: 'Protospace Etiquette',
});

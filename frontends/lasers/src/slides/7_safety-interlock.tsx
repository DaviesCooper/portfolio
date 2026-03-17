import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

const BASE = import.meta.env.BASE_URL;

function Slide12d4(): JSX.Element {
  return (
    <ColumnSlide
      left={
        <div>
          <p>The XTool has a lid interlock that prevents the lid from being opened while the machine is running.</p>
          <p>If the lid interlock is disabled, the machine will be able to run without the lid interlock.</p>
          <p>This turns the machine from a class 2 laser to a class 4 laser.</p>
          <br/>
          <p>Intentionally disabling the lid interlock is cause for membership termination.</p>
        </div>
      }
      right={
        <div className="slide-12d2-img slide-12d2-img-back">
          <img
            src={`${BASE}lid-interlock.png`}
            alt="XTool lid interlock"
            draggable={false}
          />
        </div>
      }
    />
  );
}

export default defineSlide(Slide12d4, {
  id: 'safety-interlock',
  title: 'Safety',
  whenTool: 'xtool',
});

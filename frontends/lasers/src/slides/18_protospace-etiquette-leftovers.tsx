import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import './17_protospace-etiquette.css';

function Slide13(): JSX.Element {

  const BASE = import.meta.env.BASE_URL;
  const src = `${BASE}offcuts.png`;


  return (
    <ColumnSlide
      left={
        <div>
          <p>The offcut shelf is free for anyone to use.</p>
          <p>If you want to leave material for others, please make sure it is large enough to be useful.</p>
          <p> If it is too small you will be making more work for the cleanup crew.</p>
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
  id: 'protospace-etiquette-leftovers',
  title: 'Protospace Etiquette',
});

import { useState } from 'react';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

const BASE = import.meta.env.BASE_URL;
const MEDIA_ITEMS = [
  { type: 'video' as const, src: `${BASE}trotec-fire.mp4`, ariaLabel: 'Safety video' },
  { type: 'image' as const, src: `${BASE}trotec-damage-1.jpeg`, alt: 'Laser cutter damage example 1' },
  { type: 'image' as const, src: `${BASE}trotec-damage-2.jpeg`, alt: 'Laser cutter damage example 2' },
] as const;

function Slide12(): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const item = MEDIA_ITEMS[selectedIndex];

  const renderMedia = () => {
    if (item.type === 'image') {
      return <img src={item.src} alt={item.alt} draggable={false} />;
    }
    return (
      <video
        src={item.src}
        controls
        playsInline
        muted
        aria-label={item.ariaLabel}
      />
    );
  };

  return (
    <ColumnSlide
      left={
        <div>
          <p>There is no risk of fire.</p>
          <p>There is a guarantee of fire.</p>
          <br/>
          <p>NEVER leave the laser cutter unattended while it is running.</p>
        </div>
      }
      right={
        <div className="column-slide-media-viewer">
          <div className="column-slide-media-viewer-content">
            {renderMedia()}
          </div>
          <div className="column-slide-media-dots" role="tablist" aria-label="Select media">
            {MEDIA_ITEMS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === selectedIndex}
                aria-label={`View ${i === 0 ? 'damage photo 1' : i === 1 ? 'damage photo 2' : 'safety video'}`}
                className="column-slide-media-dot"
                onClick={() => setSelectedIndex(i)}
              />
            ))}
          </div>
        </div>
      }
    />
  );
}

export default defineSlide(Slide12, {
  id: 'safety',
  title: 'Safety',
});

import { useEffect } from 'react';
import { Slide } from './Slide';
import { TitleSlide } from './TitleSlide';
import { useSlideNavigation, type UseSlideNavigationResult } from '../../hooks';
import { defaultSlideSource } from '../../slides';
import type { ReactNode } from 'react';
import type { LaserTool, SlideComponent, SlideSource } from '../../lib';
import './Slideshow.css';

export interface SlideshowProps {
  /** Slide deck to display. Defaults to the built-in deck (D — depend on abstraction). */
  readonly slideSource?: SlideSource;
  /** Selected laser machine; used to conditionally render tool-specific slide content. */
  readonly selectedTool: LaserTool;
  /** Called when the current slide index changes (e.g. for hiding UI on non-intro slides on mobile). */
  readonly onSlideChange?: (index: number) => void;
}

export function Slideshow(props: SlideshowProps): JSX.Element {
  const { slideSource = defaultSlideSource, selectedTool, onSlideChange } = props;
  const slides: ReadonlyArray<SlideComponent> = slideSource.slides.filter(
    (s) => s.whenTool == null || s.whenTool === selectedTool
  );
  const slideCount: number = slides.length;
  const navigation: UseSlideNavigationResult = useSlideNavigation(slideCount);
  const { index, total, goNext, goPrev, goTo } = navigation;

  useEffect(() => {
    onSlideChange?.(index);
  }, [index, onSlideChange]);

  if (total === 0) {
    return (
      <div className="slideshow">
        <p className="slide-lead">No slides in this deck.</p>
      </div>
    );
  }

  const SlideComponent = slides[index];
  const slideLabel: string = slideSource.getSlideLabel(SlideComponent, index);
  const isTitleSlide: boolean = SlideComponent.id === 'title';
  const resolvedContent: ReactNode = <SlideComponent tool={selectedTool} />;

  const slideProps: {
    id: string;
    title?: ReactNode;
    subtitle?: ReactNode;
    'aria-label': string;
    children: ReactNode;
  } = {
    id: SlideComponent.id,
    title: SlideComponent.title,
    subtitle: SlideComponent.subtitle,
    'aria-label': `Slide ${index + 1} of ${total}: ${slideLabel}`,
    children: resolvedContent,
  };

  return (
    <div className="slideshow">
      {isTitleSlide ? (
        <TitleSlide key={SlideComponent.id} {...slideProps} />
      ) : (
        <Slide key={SlideComponent.id} {...slideProps} />
      )}

      <nav className="nav" aria-label="Slideshow navigation">
        <div className="nav-dots" role="tablist" aria-label="Slide list">
          {slides.map((s: SlideComponent, i: number) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={`nav-dot ${i === index ? 'active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <span className="slide-counter" aria-live="polite">
          {index + 1} / {total}
        </span>
        <div className="nav-buttons">
          <button
            type="button"
            className="nav-btn"
            onClick={goPrev}
            disabled={total <= 1}
            aria-label="Previous slide"
          >
            Previous
          </button>
          <button
            type="button"
            className="nav-btn next"
            onClick={goNext}
            aria-label="Next slide"
          >
            Next
          </button>
        </div>
      </nav>
    </div>
  );
}

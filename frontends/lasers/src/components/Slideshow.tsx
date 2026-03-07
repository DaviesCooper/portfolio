import { Slide } from './Slide';
import { TitleSlide } from './TitleSlide';
import {
  useSlideKeyboard,
  useSlideNavigation,
  type UseSlideKeyboardOptions,
  type UseSlideNavigationResult,
} from '../hooks';
import { defaultSlideSource } from '../slides';
import type { ReactNode } from 'react';
import type { LaserTool, SlideContent, SlideData, SlideSource } from '../types';
import './Slideshow.css';

function resolveContent(content: SlideContent, tool: LaserTool): ReactNode {
  return typeof content === 'function' ? content(tool) : content;
}

export interface SlideshowProps {
  /** Slide deck to display. Defaults to the built-in deck (D — depend on abstraction). */
  readonly slideSource?: SlideSource;
  /** Selected laser machine; used to conditionally render tool-specific slide content. */
  readonly selectedTool: LaserTool;
}

export function Slideshow(props: SlideshowProps): JSX.Element {
  const { slideSource = defaultSlideSource, selectedTool } = props;
  const slides: SlideSource['slides'] = slideSource.slides;
  const slideCount: number = slides.length;
  const navigation: UseSlideNavigationResult = useSlideNavigation(slideCount);
  const { index, total, goNext, goPrev, goTo } = navigation;
  const keyboardOptions: UseSlideKeyboardOptions = { goNext, goPrev, goTo, total };
  useSlideKeyboard(keyboardOptions);

  if (total === 0) {
    return (
      <div className="slideshow">
        <p className="slide-lead">No slides in this deck.</p>
      </div>
    );
  }

  const slideData: SlideData = slides[index];
  const slideLabel: string = slideSource.getSlideLabel(slideData, index);
  const isTitleSlide: boolean = slideData.id === 'title';
  const resolvedContent: ReactNode = resolveContent(slideData.content, selectedTool);

  const slideProps: {
    id: string;
    title?: ReactNode;
    subtitle?: ReactNode;
    'aria-label': string;
    children: ReactNode;
  } = {
    id: slideData.id,
    title: slideData.title,
    subtitle: slideData.subtitle,
    'aria-label': `Slide ${index + 1} of ${total}: ${slideLabel}`,
    children: resolvedContent,
  };

  return (
    <div className="slideshow">
      {isTitleSlide ? (
        <TitleSlide {...slideProps} />
      ) : (
        <Slide {...slideProps} />
      )}

      <nav className="nav" aria-label="Slideshow navigation">
        <div className="nav-dots" role="tablist" aria-label="Slide list">
          {slides.map((s: SlideData, i: number) => (
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

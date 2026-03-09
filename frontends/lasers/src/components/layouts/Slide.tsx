import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { getSlideAriaLabel } from '../../lib';

export interface SlideProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  readonly id: string;
  /** Main heading. Omit for custom layout or no title. */
  readonly title?: ReactNode;
  /** Shown above title (e.g. venue name). */
  readonly subtitle?: ReactNode;
  readonly children: ReactNode;
  /** Extra class for the section. Use for per-slide layout or animation. */
  readonly className?: string;
}

/**
 * One slide in the deck. Use this directly when you need custom layout,
 * full-width media, or other "wild" content—otherwise use slide data in slides.tsx.
 */
export function Slide(props: SlideProps): JSX.Element {
  const { id, title, subtitle, children, className = '', ...rest } = props;
  const ariaLabel: string = getSlideAriaLabel(id, title, subtitle);

  return (
    <section
      id={id}
      className={`slide ${className}`.trim()}
      aria-label={ariaLabel}
      data-slide-id={id}
      {...rest}
    >
      {subtitle != null && <p className="slide-subtitle">{subtitle}</p>}
      {title != null && <h2 className="slide-title">{title}</h2>}
      <div className="slide-content">{children}</div>
    </section>
  );
}

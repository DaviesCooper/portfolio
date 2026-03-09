import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { getSlideAriaLabel } from '../../lib';
import './TitleSlide.css';

export interface TitleSlideProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  readonly id: string;
  /** Main heading; rendered larger than on regular slides. */
  readonly title?: ReactNode;
  /** Shown below the main title. */
  readonly subtitle?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Title slide variant with a larger main heading. Use for the first slide of the deck.
 */
export function TitleSlide(props: TitleSlideProps): JSX.Element {
  const { id, title, subtitle, children, className = '', ...rest } = props;
  const ariaLabel: string = getSlideAriaLabel(id, title, subtitle);

  return (
    <section
      id={id}
      className={`slide title-slide ${className}`.trim()}
      aria-label={ariaLabel}
      data-slide-id={id}
      {...rest}
    >
      {title != null && <h1 className="title-slide-title">{title}</h1>}
      {subtitle != null && <p className="slide-subtitle title-slide-subtitle">{subtitle}</p>}
      <div className="slide-content">{children}</div>
    </section>
  );
}

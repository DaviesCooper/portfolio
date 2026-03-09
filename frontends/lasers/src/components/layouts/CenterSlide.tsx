import type { ReactNode } from 'react';
import './CenterSlide.css';

export interface CenterSlideProps {
  children: ReactNode;
}

/** Centered single-column layout for intro/title-style slides. */
export function CenterSlide({ children }: CenterSlideProps): JSX.Element {
  return <div className="center-slide">{children}</div>;
}

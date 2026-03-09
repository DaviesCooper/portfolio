import type { ReactNode } from 'react';
import './ColumnSlide.css';

export interface ColumnSlideProps {
  left: ReactNode;
  right: ReactNode;
}

/** Two-column layout: left = text, right = simulation (SimulationLayout). */
export function ColumnSlide({ left, right }: ColumnSlideProps): JSX.Element {
  return (
    <div className="column-slide">
      <div className="column-slide-left">{left}</div>
      <div className="column-slide-right">{right}</div>
    </div>
  );
}

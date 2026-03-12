import type { ReactNode } from 'react';
import './ColumnSlide.css';

export interface ColumnSlideProps {
  left: ReactNode;
  right: ReactNode;
  /** When true, left column is narrower to give right (e.g. command list) more width. */
  narrowLeft?: boolean;
  /** Optional class name applied to the root element (e.g. for slide-specific layout). */
  className?: string;
}

/** Two-column layout: left = text, right = simulation (SimulationLayout). */
export function ColumnSlide({ left, right, narrowLeft, className }: ColumnSlideProps): JSX.Element {
  return (
    <div
      className={`column-slide${narrowLeft ? ' column-slide-narrow-left' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="column-slide-left">{left}</div>
      <div className="column-slide-right">{right}</div>
    </div>
  );
}

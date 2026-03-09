import type { ReactNode } from 'react';
import './SimulationLayout.css';

/** Props for SimulationLayout; also the shape passed to simulation render props. */
export interface SimulationLayoutProps {
  canvas: ReactNode;
  caption: ReactNode;
  /** Play button (if any), reset button, etc. */
  buttons: ReactNode;
  /** When set, desktop uses 2x2 grid with controls in (0,1); mobile adds third row for controls. */
  controls?: ReactNode;
}

export type SimulationLayoutParts = SimulationLayoutProps;

/**
 * Layout for simulation slides.
 * Desktop with controls: 2 cols × 2 rows — (0,0) canvas, (0,1) controls, (1,0) play/reset/caption, (1,1) empty.
 * Desktop without controls: 1 col × 2 rows — (0,0) canvas, (0,1) caption and reset.
 * Mobile: 1 col × 3 rows (or 2 if no controls) — (0,0) canvas, (0,1) play/reset/caption, (0,2) controls.
 */
export function SimulationLayout({
  canvas,
  caption,
  buttons,
  controls,
}: SimulationLayoutProps): JSX.Element {
  const hasControls = controls != null;
  return (
    <div
      className={`simulation-layout ${hasControls ? 'simulation-layout-has-controls' : ''}`}
      data-has-controls={hasControls}
    >
      <div className="simulation-layout-cell simulation-layout-canvas">{canvas}</div>
      {hasControls && (
        <div className="simulation-layout-cell simulation-layout-controls">{controls}</div>
      )}
      <div className="simulation-layout-cell simulation-layout-buttons-caption">
        {buttons != null && <div className="simulation-layout-buttons">{buttons}</div>}
        <div className="simulation-layout-caption">{caption}</div>
      </div>
    </div>
  );
}

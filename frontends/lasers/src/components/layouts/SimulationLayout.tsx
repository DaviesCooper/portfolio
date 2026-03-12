import type { ReactNode } from 'react';
import './SimulationLayout.css';

/** Props for SimulationLayout; also the shape passed to simulation render props. */
export interface SimulationLayoutProps {
  canvas: ReactNode;
  caption: ReactNode;
  /** Play button (if any), reset button, etc. */
  buttons: ReactNode;
  // A list of either sliders, or command lists.
  controls?: ReactNode;
}

export type SimulationLayoutParts = SimulationLayoutProps;

/**
 * Layout for simulation slides.
 * Desktop: BurnVisualization and the controls in a row right of it. Sliders should be vertical. Sliders and command lists should be the height of the burn visualization.
 * Mobile: BurnVisualization and the controls in a column below it. Sliders should be horizontal. Sliders, command lists, and the burn visualization should be the width of the screen.
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
      {hasControls ? (
        <div className="simulation-layout-cell simulation-layout-canvas-and-controls">
          <div className="simulation-layout-canvas">{canvas}</div>
          <div className="simulation-layout-controls">{controls}</div>
        </div>
      ) : (
        <div className="simulation-layout-cell simulation-layout-canvas">{canvas}</div>
      )}
      <div className="simulation-layout-cell simulation-layout-buttons-caption">
        {buttons != null && <div className="simulation-layout-buttons">{buttons}</div>}
        <div className="simulation-layout-caption">{caption}</div>
      </div>
    </div>
  );
}

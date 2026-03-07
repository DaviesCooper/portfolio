import { useCallback, useRef, useState } from 'react';
import './PowerKnob.css';

/** 0% and 100% both at 6:00; pointer sweeps full circle 6→9→12→3→6. CSS rotate: 0 = 12 o'clock, positive = clockwise. */
const ANGLE_6_OCLOCK = Math.PI;
/** Pixels of horizontal drag per 1% change (drag right = increase). */
const PIXELS_PER_PERCENT = 3;

function valueToAngle(value: number): number {
  return ANGLE_6_OCLOCK + (value / 100) * 2 * Math.PI;
}

export interface PowerKnobProps {
  value: number;
  onChange: (value: number) => void;
  'aria-label'?: string;
}

export function PowerKnob(props: PowerKnobProps): JSX.Element {
  const { value, onChange, 'aria-label': ariaLabel = 'Power' } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastXRef = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      lastXRef.current = e.clientX;
      setIsDragging(true);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      const deltaValue = deltaX / PIXELS_PER_PERCENT;
      const next = Math.round(Math.max(0, Math.min(100, value + deltaValue)));
      onChange(next);
    },
    [isDragging, value, onChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  }, []);

  const angle = valueToAngle(value);

  return (
    <div
      ref={containerRef}
      className={`power-knob ${isDragging ? 'dragging' : ''}`}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault();
          onChange(Math.min(100, value + step));
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault();
          onChange(Math.max(0, value - step));
        }
      }}
    >
      <div className="power-knob-track" />
      <div
        className="power-knob-pointer"
        style={{ transform: `rotate(${angle}rad)` }}
      />
      <span className="power-knob-value">{value}%</span>
    </div>
  );
}

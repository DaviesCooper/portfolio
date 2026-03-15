import { useCallback, useRef, useState } from 'react';
import './Slider.css';
import { SliderProps } from './Slider';

function valueFromClientX(
  clientX: number,
  rect: DOMRect,
  minValue: number,
  maxValue: number,
  step: number
): number {
  const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  let v = minValue + fraction * (maxValue - minValue);
  if (step > 0) {
    v = Math.round(v / step) * step;
  }
  return Math.max(minValue, Math.min(maxValue, v));
}

export function HorizontalSlider({
  minValue = 0,
  maxValue = 100,
  step = 1,
  value: controlledValue,
  defaultValue,
  label,
  onChange,
  formatValue,
}: SliderProps): JSX.Element {
  const [uncontrolledValue, setUncontrolledValue] = useState<number>(
    () => defaultValue ?? minValue + (maxValue - minValue) / 2
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const overlayRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next);
    },
    [onChange, isControlled]
  );

  const setValueFromPointer = useCallback(
    (clientX: number) => {
      const el = overlayRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = valueFromClientX(clientX, rect, minValue, maxValue, step);
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next);
    },
    [minValue, maxValue, step, isControlled, onChange]
  );

  const onOverlayPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setValueFromPointer(e.clientX);
    },
    [setValueFromPointer]
  );

  const onOverlayPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      setValueFromPointer(e.clientX);
    },
    [setValueFromPointer]
  );

  const onOverlayPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    draggingRef.current = false;
  }, []);

  const displayValue = formatValue ? formatValue(value) : String(value);
  const id = label ? `slider-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <div className="slider slider--horizontal" role={label ? 'group' : undefined} aria-label={label}>
      {label && (
        <label className="slider__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="slider__track-wrap">
        <div className="slider__track-hit-area">
          <input
            id={id}
            type="range"
            className="slider__input"
            min={minValue}
            max={maxValue}
            step={step}
            value={value}
            onChange={handleChange}
            aria-valuemin={minValue}
            aria-valuemax={maxValue}
            aria-valuenow={value}
            aria-label={label}
          />
          <div
            ref={overlayRef}
            className="slider__hit-area-overlay"
            aria-hidden
            onPointerDown={onOverlayPointerDown}
            onPointerMove={onOverlayPointerMove}
            onPointerUp={onOverlayPointerUp}
            onPointerLeave={onOverlayPointerUp}
          />
        </div>
        <span className="slider__value" aria-live="polite">
          {displayValue}
        </span>
      </div>
    </div>
  );
}

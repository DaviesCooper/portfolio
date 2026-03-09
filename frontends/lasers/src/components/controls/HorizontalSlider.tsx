import { useCallback, useState } from 'react';
import './Slider.css';

export interface HorizontalSliderProps {
  label?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  formatValue?: (value: number) => string;
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
}: HorizontalSliderProps): JSX.Element {
  const [uncontrolledValue, setUncontrolledValue] = useState<number>(
    () => defaultValue ?? minValue + (maxValue - minValue) / 2
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(e.target.value);
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next);
    },
    [onChange, isControlled]
  );

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
        <span className="slider__value" aria-live="polite">
          {displayValue}
        </span>
      </div>
    </div>
  );
}

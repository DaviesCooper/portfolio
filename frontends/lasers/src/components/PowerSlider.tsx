import './PowerSlider.css';

export interface PowerSliderProps {
  value: number;
  onChange: (value: number) => void;
  'aria-label'?: string;
}

export function PowerSlider(props: PowerSliderProps): JSX.Element {
  const { value, onChange, 'aria-label': ariaLabel = 'Power' } = props;

  return (
    <div className="power-slider-wrap">
      <div className="power-slider-inner">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="power-slider-input"
          role="slider"
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        />
      </div>
      <span className="power-slider-value" aria-hidden>
        {value}%
      </span>
    </div>
  );
}

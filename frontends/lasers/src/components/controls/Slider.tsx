import { useMatchMedia } from '../../hooks';
import { HorizontalSlider } from './HorizontalSlider';
import { VerticalSlider } from './VerticalSlider';

const MOBILE_MEDIA_QUERY = '(max-width: 999px)';

export interface SliderProps {
    label?: string;
    minValue?: number;
    maxValue?: number;
    step?: number;
    value?: number;
    defaultValue?: number;
    onChange?: (value: number) => void;
    formatValue?: (value: number) => string;
  }

export const Slider = ({
  label,
  minValue,
  maxValue,
  step,
  value,
  onChange,
  formatValue,
}: SliderProps): JSX.Element => {
  const isMobile = useMatchMedia(MOBILE_MEDIA_QUERY);
  if (isMobile) {
    return <HorizontalSlider label={label} minValue={minValue} maxValue={maxValue} step={step} value={value} onChange={onChange} formatValue={formatValue} />;
  }
  return <VerticalSlider label={label} minValue={minValue} maxValue={maxValue} step={step} value={value} onChange={onChange} formatValue={formatValue} />;
};
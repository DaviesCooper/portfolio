import './TriSelect.css';

export type TriSelectIndex = 0 | 1 | 2;

export interface TriSelectProps {
  /** Current selected index (0, 1, or 2). */
  value: TriSelectIndex;
  /** Called when the user selects a different option. */
  onChange: (index: TriSelectIndex) => void;
  /** Labels for the three options, in order. */
  options: readonly [string, string, string];
  /** Optional ARIA label for the group. */
  'aria-label'?: string;
}

export function TriSelect(props: TriSelectProps): JSX.Element {
  const { value, onChange, options, 'aria-label': ariaLabel } = props;

  return (
    <div
      className="tri-select"
      role="group"
      aria-label={ariaLabel}
    >
      {(options as [string, string, string]).map((label, i) => {
        const index = i as TriSelectIndex;
        const isSelected = value === index;
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={label}
            className={`tri-select__option ${isSelected ? 'tri-select__option--selected' : ''}`}
            onClick={() => onChange(index)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

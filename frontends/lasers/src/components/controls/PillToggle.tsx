import './PillToggle.css';

export interface PillToggleProps {
  /** Current selected value. */
  value: boolean;
  /** Called when the user selects a different option. */
  onChange: (value: boolean) => void;
  /** Labels for the two options [false, true]. */
  options: readonly [string, string];
  /** Optional ARIA label for the group. */
  'aria-label'?: string;
}

export function PillToggle(props: PillToggleProps): JSX.Element {
  const { value, onChange, options, 'aria-label': ariaLabel } = props;

  return (
    <div
      className="pill-toggle-wrap"
      role="group"
      aria-label={ariaLabel}
      data-value={value ? 'true' : 'false'}
    >
      <span className="pill-toggle__label">{options[0]}</span>
      <div className="pill-toggle">
        <button
          type="button"
          className="pill-toggle__track"
          role="switch"
          aria-checked={value}
          aria-label={ariaLabel ?? `${options[0]} / ${options[1]}`}
          onClick={() => onChange(!value)}
        >
          <div className="pill-toggle__thumb" aria-hidden />
        </button>
      </div>
      <span className="pill-toggle__label">{options[1]}</span>
    </div>
  );
}

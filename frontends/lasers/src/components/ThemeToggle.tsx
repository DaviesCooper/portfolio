import type { MouseEvent } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeToggleProps {
  readonly theme: Theme;
  readonly onToggle: (next: Theme) => void;
}

export function ThemeToggle(props: ThemeToggleProps): JSX.Element {
  const { theme, onToggle } = props;

  const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    onToggle(theme === 'dark' ? 'light' : 'dark');
  };

  const label: string = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="theme-toggle"
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  );
}

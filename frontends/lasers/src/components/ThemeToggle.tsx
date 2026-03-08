import type { MouseEvent } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeToggleProps {
  readonly theme: Theme;
  readonly onToggle: (next: Theme) => void;
  /** When false, toggle is hidden on mobile so it doesn’t cover content (shown only on intro slide). */
  readonly isIntroSlide?: boolean;
}

export function ThemeToggle(props: ThemeToggleProps): JSX.Element {
  const { theme, onToggle, isIntroSlide = true } = props;
  const hideOnMobile = !isIntroSlide;

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
      className={`theme-toggle${hideOnMobile ? ' theme-toggle--hide-on-mobile' : ''}`}
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  );
}

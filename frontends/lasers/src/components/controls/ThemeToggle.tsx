import type { MouseEvent } from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';

export type { Theme };

export interface ThemeToggleProps {
  /** When false, toggle is hidden on mobile (shown only on intro slide). */
  readonly isIntroSlide?: boolean;
}

export function ThemeToggle(props: ThemeToggleProps): JSX.Element {
  const { isIntroSlide = true } = props;
  const { theme, setTheme } = useTheme();
  const hideOnMobile = !isIntroSlide;

  const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    setTheme(theme === 'dark' ? 'light' : 'dark');
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

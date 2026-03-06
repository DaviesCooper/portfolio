import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Slideshow } from './components/Slideshow';
import { ThemeToggle, type Theme } from './components/ThemeToggle';

const THEME_STORAGE_KEY = 'lasers-theme';

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export default function App(): JSX.Element {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <>
      <ThemeToggle theme={theme} onToggle={setTheme} />
      <Slideshow />
    </>
  );
}

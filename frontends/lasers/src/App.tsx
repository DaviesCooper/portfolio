import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { LaserToolProvider } from './context/LaserToolContext';
import { ThemeProvider } from './context/ThemeContext';
import { Slideshow } from './components/layouts/Slideshow';
import { ThemeToggle } from './components/controls/ThemeToggle';
import type { LaserTool } from './lib';
import type { Theme } from './context/ThemeContext';

const THEME_STORAGE_KEY = 'lasers-theme';
const TOOL_STORAGE_KEY = 'lasers-tool';

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function readStoredTool(): LaserTool {
  const stored = localStorage.getItem(TOOL_STORAGE_KEY);
  if (stored === 'xtool' || stored === 'trotec' || stored === 'thunder') return stored;
  return 'xtool';
}

export default function App(): JSX.Element {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [tool, setTool] = useState<LaserTool>(readStoredTool);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(TOOL_STORAGE_KEY, tool);
  }, [tool]);

  return (
    <ThemeProvider value={{ theme, setTheme }}>
      <LaserToolProvider value={{ tool, setTool }}>
        <ThemeToggle isIntroSlide={slideIndex === 0} />
        <Slideshow selectedTool={tool} onSlideChange={setSlideIndex} />
      </LaserToolProvider>
    </ThemeProvider>
  );
}

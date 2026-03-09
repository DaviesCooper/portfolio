import { createContext, useContext, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextValue {
  readonly theme: Theme;
  readonly setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider(props: {
  readonly value: ThemeContextValue;
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <ThemeContext.Provider value={props.value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx == null) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

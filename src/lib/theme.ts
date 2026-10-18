import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bus-system-theme';

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Light/dark theme, persisted to localStorage and seeded from the system preference. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (private mode); the class still applies.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggle };
}

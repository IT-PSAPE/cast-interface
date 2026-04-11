import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeMode } from '../types/ui';
import { useLocalStorage } from '../hooks/use-local-storage';

const STORAGE_KEY = 'cast-theme-mode';
const VALID_MODES = new Set<ThemeMode>(['light', 'dark', 'system']);

type ThemeContextValue = {
  state: {
    themeMode: ThemeMode;
    resolvedTheme: 'light' | 'dark';
  };
  actions: {
    setThemeMode: (mode: ThemeMode) => void;
  };
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function parseThemeMode(raw: string): ThemeMode | null {
  return VALID_MODES.has(raw as ThemeMode) ? (raw as ThemeMode) : null;
}

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useLocalStorage<ThemeMode>(STORAGE_KEY, 'dark', parseThemeMode);
  const [systemPref, setSystemPref] = useState<'light' | 'dark'>(getSystemPreference);

  const resolvedTheme = themeMode === 'system' ? systemPref : themeMode;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e: MediaQueryListEvent) {
      setSystemPref(e.matches ? 'dark' : 'light');
    }
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const state = useMemo<ThemeContextValue['state']>(() => ({
    themeMode,
    resolvedTheme,
  }), [themeMode, resolvedTheme]);

  const actions = useMemo<ThemeContextValue['actions']>(() => ({
    setThemeMode,
  }), [setThemeMode]);

  const value = useMemo<ThemeContextValue>(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

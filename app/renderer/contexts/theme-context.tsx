import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeMode } from '../types/ui';

const STORAGE_KEY = 'cast-theme-mode';

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

function getStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'dark';
}

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeRaw] = useState<ThemeMode>(getStoredThemeMode);
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

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeRaw(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

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

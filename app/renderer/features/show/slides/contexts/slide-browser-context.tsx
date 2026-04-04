import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PlaylistBrowserMode, SlideBrowserMode } from '../../../../types/ui';

interface SlideBrowserContextValue {
  playlistBrowserMode: PlaylistBrowserMode;
  setPlaylistBrowserMode: (mode: PlaylistBrowserMode) => void;
  slideBrowserMode: SlideBrowserMode;
  setSlideBrowserMode: (mode: SlideBrowserMode) => void;
}

const SlideBrowserContext = createContext<SlideBrowserContextValue | null>(null);
const STORAGE_KEY = 'cast-interface.slide-browser-preferences.v1';

export function SlideBrowserProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(getStoredSlideBrowserPreferences);
  const setSlideBrowserMode = (mode: SlideBrowserMode) => {
    const next = { ...preferences, slideBrowserMode: mode };
    setPreferences(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const setPlaylistBrowserMode = (mode: PlaylistBrowserMode) => {
    const next = { ...preferences, playlistBrowserMode: mode };
    setPreferences(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const value = useMemo(
    () => ({
      playlistBrowserMode: preferences.playlistBrowserMode,
      setPlaylistBrowserMode,
      slideBrowserMode: preferences.slideBrowserMode,
      setSlideBrowserMode,
    }),
    [preferences],
  );

  return <SlideBrowserContext.Provider value={value}>{children}</SlideBrowserContext.Provider>;
}

export function useSlideBrowser(): SlideBrowserContextValue {
  const context = useContext(SlideBrowserContext);
  if (!context) throw new Error('useSlideBrowser must be used within SlideBrowserProvider');
  return context;
}

function getStoredSlideBrowserPreferences(): {
  slideBrowserMode: SlideBrowserMode;
  playlistBrowserMode: PlaylistBrowserMode;
} {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { slideBrowserMode: 'grid', playlistBrowserMode: 'current' };
    const parsed = JSON.parse(raw) as {
      slideBrowserMode?: SlideBrowserMode;
      playlistBrowserMode?: PlaylistBrowserMode;
    };
    return {
      slideBrowserMode: parsed.slideBrowserMode === 'grid' || parsed.slideBrowserMode === 'list'
        ? parsed.slideBrowserMode
        : 'grid',
      playlistBrowserMode: parsed.playlistBrowserMode === 'current' || parsed.playlistBrowserMode === 'tabs' || parsed.playlistBrowserMode === 'continuous'
        ? parsed.playlistBrowserMode
        : 'current',
    };
  } catch {
    return { slideBrowserMode: 'grid', playlistBrowserMode: 'current' };
  }
}

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PlaylistBrowserMode, SlideBrowserMode } from '../../../../types/ui';
import { useGridSize } from '../../../../hooks/use-grid-size';

interface SlideBrowserContextValue {
  gridItemSize: number;
  gridSizeMax: number;
  gridSizeMin: number;
  playlistBrowserMode: PlaylistBrowserMode;
  setGridItemSize: (size: number) => void;
  setPlaylistBrowserMode: (mode: PlaylistBrowserMode) => void;
  slideBrowserMode: SlideBrowserMode;
  setSlideBrowserMode: (mode: SlideBrowserMode) => void;
}

const SlideBrowserContext = createContext<SlideBrowserContextValue | null>(null);
const STORAGE_KEY = 'cast-interface.slide-browser-preferences.v1';

export function SlideBrowserProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(getStoredSlideBrowserPreferences);
  const { gridSize, setGridSize, min: gridSizeMin, max: gridSizeMax } = useGridSize('cast-interface.grid-size.slide-browser', 240, 160, 400);
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
      gridItemSize: gridSize,
      gridSizeMax,
      gridSizeMin,
      playlistBrowserMode: preferences.playlistBrowserMode,
      setGridItemSize: setGridSize,
      setPlaylistBrowserMode,
      slideBrowserMode: preferences.slideBrowserMode,
      setSlideBrowserMode,
    }),
    [gridSize, gridSizeMax, gridSizeMin, preferences, setGridSize],
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

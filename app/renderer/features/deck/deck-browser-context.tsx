import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PlaylistBrowserMode, SlideBrowserMode } from '../../types/ui';
import { useGridSize } from '../../hooks/use-grid-size';

interface DeckBrowserContextValue {
  gridItemSize: number;
  gridSizeMax: number;
  gridSizeMin: number;
  gridSizeStep: number;
  playlistBrowserMode: PlaylistBrowserMode;
  setGridItemSize: (size: number) => void;
  setPlaylistBrowserMode: (mode: PlaylistBrowserMode) => void;
  slideBrowserMode: SlideBrowserMode;
  setSlideBrowserMode: (mode: SlideBrowserMode) => void;
}

const DeckBrowserContext = createContext<DeckBrowserContextValue | null>(null);
const STORAGE_KEY = 'recast.deck-browser-preferences.v1';

export function DeckBrowserProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(getStoredSlideBrowserPreferences);
  const { gridSize, setGridSize, min: gridSizeMin, max: gridSizeMax, step: gridSizeStep } = useGridSize('recast.grid-size.slide-browser', 6, 4, 8);
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
      gridSizeStep,
      playlistBrowserMode: preferences.playlistBrowserMode,
      setGridItemSize: setGridSize,
      setPlaylistBrowserMode,
      slideBrowserMode: preferences.slideBrowserMode,
      setSlideBrowserMode,
    }),
    [gridSize, gridSizeMax, gridSizeMin, gridSizeStep, preferences, setGridSize],
  );

  return <DeckBrowserContext.Provider value={value}>{children}</DeckBrowserContext.Provider>;
}

export function useDeckBrowser(): DeckBrowserContextValue {
  const context = useContext(DeckBrowserContext);
  if (!context) throw new Error('useDeckBrowser must be used within DeckBrowserProvider');
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

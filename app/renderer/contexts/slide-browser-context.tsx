import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PlaylistBrowserMode, SlideBrowserMode } from '../types/ui';

interface SlideBrowserContextValue {
  playlistBrowserMode: PlaylistBrowserMode;
  setPlaylistBrowserMode: (mode: PlaylistBrowserMode) => void;
  slideBrowserMode: SlideBrowserMode;
  setSlideBrowserMode: (mode: SlideBrowserMode) => void;
}

const SlideBrowserContext = createContext<SlideBrowserContextValue | null>(null);

export function SlideBrowserProvider({ children }: { children: ReactNode }) {
  const [slideBrowserMode, setSlideBrowserMode] = useState<SlideBrowserMode>('grid');
  const [playlistBrowserMode, setPlaylistBrowserMode] = useState<PlaylistBrowserMode>('current');
  const value = useMemo(
    () => ({ playlistBrowserMode, setPlaylistBrowserMode, slideBrowserMode, setSlideBrowserMode }),
    [playlistBrowserMode, slideBrowserMode],
  );

  return <SlideBrowserContext.Provider value={value}>{children}</SlideBrowserContext.Provider>;
}

export function useSlideBrowser(): SlideBrowserContextValue {
  const context = useContext(SlideBrowserContext);
  if (!context) throw new Error('useSlideBrowser must be used within SlideBrowserProvider');
  return context;
}

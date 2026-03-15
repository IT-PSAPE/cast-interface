import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LibraryPanelView } from '../../../types/ui';

interface LibraryPanelContextValue {
  libraryPanelView: LibraryPanelView;
  setLibraryPanelView: (view: LibraryPanelView) => void;
}

const LibraryPanelContext = createContext<LibraryPanelContextValue | null>(null);
const STORAGE_KEY = 'cast-interface.library-panel-view.v1';

export function LibraryPanelProvider({ children }: { children: ReactNode }) {
  const [libraryPanelView, setLibraryPanelViewState] = useState<LibraryPanelView>(getStoredLibraryPanelView);
  const setLibraryPanelView = (view: LibraryPanelView) => {
    setLibraryPanelViewState(view);
    window.localStorage.setItem(STORAGE_KEY, view);
  };
  const value = useMemo(() => ({ libraryPanelView, setLibraryPanelView }), [libraryPanelView]);
  return <LibraryPanelContext.Provider value={value}>{children}</LibraryPanelContext.Provider>;
}

export function useLibraryPanelState(): LibraryPanelContextValue {
  const context = useContext(LibraryPanelContext);
  if (!context) throw new Error('useLibraryPanelState must be used within LibraryPanelProvider');
  return context;
}

function getStoredLibraryPanelView(): LibraryPanelView {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'playlist' ? 'playlist' : 'libraries';
}

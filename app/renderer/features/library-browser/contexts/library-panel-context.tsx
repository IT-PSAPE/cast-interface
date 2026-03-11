import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LibraryPanelView } from '../../../types/ui';

interface LibraryPanelContextValue {
  libraryPanelView: LibraryPanelView;
  setLibraryPanelView: (view: LibraryPanelView) => void;
}

const LibraryPanelContext = createContext<LibraryPanelContextValue | null>(null);

export function LibraryPanelProvider({ children }: { children: ReactNode }) {
  const [libraryPanelView, setLibraryPanelView] = useState<LibraryPanelView>('libraries');
  const value = useMemo(() => ({ libraryPanelView, setLibraryPanelView }), [libraryPanelView]);
  return <LibraryPanelContext.Provider value={value}>{children}</LibraryPanelContext.Provider>;
}

export function useLibraryPanelState(): LibraryPanelContextValue {
  const context = useContext(LibraryPanelContext);
  if (!context) throw new Error('useLibraryPanelState must be used within LibraryPanelProvider');
  return context;
}

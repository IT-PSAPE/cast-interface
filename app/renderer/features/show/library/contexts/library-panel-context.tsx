import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Id } from '@core/types';
import type { LibraryPanelView } from '../../../../types/ui';

interface LibraryPanelContextValue {
  libraryPanelView: LibraryPanelView;
  setLibraryPanelView: (view: LibraryPanelView) => void;
  isSegmentCollapsed: (segmentId: Id) => boolean;
  toggleSegmentCollapsed: (segmentId: Id) => void;
}

const LibraryPanelContext = createContext<LibraryPanelContextValue | null>(null);
const STORAGE_KEY = 'cast-interface.library-panel-view.v1';

export function LibraryPanelProvider({ children }: { children: ReactNode }) {
  const [libraryPanelView, setLibraryPanelViewState] = useState<LibraryPanelView>(getStoredLibraryPanelView);
  const [collapsedSegmentIds, setCollapsedSegmentIds] = useState<Id[]>([]);

  const setLibraryPanelView = useCallback((view: LibraryPanelView) => {
    setLibraryPanelViewState(view);
    window.localStorage.setItem(STORAGE_KEY, view);
  }, []);

  const toggleSegmentCollapsed = useCallback((segmentId: Id) => {
    setCollapsedSegmentIds((current) => (
      current.includes(segmentId)
        ? current.filter((id) => id !== segmentId)
        : [...current, segmentId]
    ));
  }, []);

  const isSegmentCollapsed = useCallback((segmentId: Id) => {
    return collapsedSegmentIds.includes(segmentId);
  }, [collapsedSegmentIds]);

  const value = useMemo(() => ({
    libraryPanelView,
    setLibraryPanelView,
    isSegmentCollapsed,
    toggleSegmentCollapsed,
  }), [isSegmentCollapsed, libraryPanelView, setLibraryPanelView, toggleSegmentCollapsed]);
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

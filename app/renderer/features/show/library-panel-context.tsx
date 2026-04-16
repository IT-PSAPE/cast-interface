import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { LibraryPanelView } from '../../types/ui';
import { useLocalStorage } from '../../hooks/use-local-storage';

interface LibraryPanelContextValue {
  libraryPanelView: LibraryPanelView;
  setLibraryPanelView: (view: LibraryPanelView) => void;
  expandedSegmentIds: string[];
  setExpandedSegmentIds: (segmentIds: string[]) => void;
}

const LibraryPanelContext = createContext<LibraryPanelContextValue | null>(null);
const VIEW_STORAGE_KEY = 'recast.library-panel-view.v1';
const EXPANDED_SEGMENTS_STORAGE_KEY = 'recast.library-panel-expanded-segments.v1';

export function LibraryPanelProvider({ children }: { children: ReactNode }) {
  const [libraryPanelView, setLibraryPanelViewState] = useLocalStorage<LibraryPanelView>(VIEW_STORAGE_KEY, 'libraries', parseLibraryPanelView);
  const [expandedSegmentIds, setExpandedSegmentIds] = useLocalStorage<string[]>(
    EXPANDED_SEGMENTS_STORAGE_KEY,
    [],
    parseExpandedSegmentIds,
    JSON.stringify,
  );

  const setLibraryPanelView = useCallback((view: LibraryPanelView) => {
    setLibraryPanelViewState(view);
  }, [setLibraryPanelViewState]);

  const value = useMemo(() => ({
    libraryPanelView,
    setLibraryPanelView,
    expandedSegmentIds,
    setExpandedSegmentIds,
  }), [expandedSegmentIds, libraryPanelView, setExpandedSegmentIds, setLibraryPanelView]);
  return <LibraryPanelContext.Provider value={value}>{children}</LibraryPanelContext.Provider>;
}

export function useLibraryPanelState(): LibraryPanelContextValue {
  const context = useContext(LibraryPanelContext);
  if (!context) throw new Error('useLibraryPanelState must be used within LibraryPanelProvider');
  return context;
}

function parseLibraryPanelView(raw: string): LibraryPanelView | null {
  return raw === 'playlist' ? 'playlist' : raw === 'libraries' ? 'libraries' : null;
}

function parseExpandedSegmentIds(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) return null;
    return parsed;
  } catch {
    return null;
  }
}

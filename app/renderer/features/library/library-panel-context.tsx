import { useWorkbench } from '../../contexts/workbench-context';

interface LibraryPanelContextValue {
  expandedSegmentIds: string[];
  libraryPanelView: ReturnType<typeof useWorkbench>['state']['libraryPanelView'];
  setExpandedSegmentIds: (segmentIds: string[]) => void;
  setLibraryPanelView: (view: ReturnType<typeof useWorkbench>['state']['libraryPanelView']) => void;
}

export function useLibraryPanelState(): LibraryPanelContextValue {
  const {
    state: {
      expandedSegmentIds,
      libraryPanelView,
    },
    actions: {
      setExpandedSegmentIds,
      setLibraryPanelView,
    },
  } = useWorkbench();

  return {
    expandedSegmentIds,
    libraryPanelView,
    setExpandedSegmentIds,
    setLibraryPanelView,
  };
}

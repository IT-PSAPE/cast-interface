import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { PlaylistTree } from '@core/types';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useLibraryPanelContextMenu } from '../hooks/use-library-panel-context-menu';
import { useLibraryPanelManagement } from '../hooks/use-library-panel-management';
import { useLibraryPanelState } from './library-panel-context';

interface LibraryBrowserContextValue {
  state: {
    selectedTree: PlaylistTree | null;
    menuState: ReturnType<typeof useLibraryPanelContextMenu>['menuState'];
    menuItems: ReturnType<typeof useLibraryPanelContextMenu>['menuItems'];
    editingLibraryId: string | null;
    editingPlaylistId: string | null;
    editingSegmentId: string | null;
    editingPresentationId: string | null;
  };
  actions: {
    setLibrariesView: () => void;
    setPlaylistView: () => void;
    renameSegment: (segmentId: string, name: string) => void;
    renameContentItem: (itemId: string, title: string) => void;
    handleLibraryContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handleLibraryContextMenu'];
    handlePlaylistContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handlePlaylistContextMenu'];
    handleSegmentContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handleSegmentContextMenu'];
    handleSegmentPresentationContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handleSegmentPresentationContextMenu'];
    openPlaylistMenuFromButton: ReturnType<typeof useLibraryPanelContextMenu>['openPlaylistMenuFromButton'];
    openSegmentMenuFromButton: ReturnType<typeof useLibraryPanelContextMenu>['openSegmentMenuFromButton'];
    openSegmentPresentationMenuFromButton: ReturnType<typeof useLibraryPanelContextMenu>['openSegmentPresentationMenuFromButton'];
    clearEditingLibrary: ReturnType<typeof useLibraryPanelContextMenu>['clearEditingLibrary'];
    clearEditingPlaylist: ReturnType<typeof useLibraryPanelContextMenu>['clearEditingPlaylist'];
    clearEditingSegment: ReturnType<typeof useLibraryPanelContextMenu>['clearEditingSegment'];
    clearEditingPresentation: ReturnType<typeof useLibraryPanelContextMenu>['clearEditingPresentation'];
    closeMenu: ReturnType<typeof useLibraryPanelContextMenu>['closeMenu'];
  };
}

const LibraryBrowserContext = createContext<LibraryBrowserContextValue | null>(null);

export function LibraryBrowserProvider({ children }: { children: ReactNode }) {
  const { currentLibraryBundle, currentPlaylistId, clearRecentlyCreated } = useNavigation();
  const { libraryPanelView, setLibraryPanelView } = useLibraryPanelState();
  const { renameSegment, renameContentItem } = useLibraryPanelManagement();
  const contextMenu = useLibraryPanelContextMenu();
  const { clearEditingLibrary } = contextMenu;

  const selectedTree = currentLibraryBundle?.playlists.find((playlist) => playlist.playlist.id === currentPlaylistId) ?? null;

  useEffect(() => {
    if (libraryPanelView === 'libraries') return;
    clearEditingLibrary();
    clearRecentlyCreated();
  }, [clearEditingLibrary, clearRecentlyCreated, libraryPanelView]);

  const value = useMemo<LibraryBrowserContextValue>(() => ({
    state: {
      selectedTree,
      menuState: contextMenu.menuState,
      menuItems: contextMenu.menuItems,
      editingLibraryId: contextMenu.editingLibraryId,
      editingPlaylistId: contextMenu.editingPlaylistId,
      editingSegmentId: contextMenu.editingSegmentId,
      editingPresentationId: contextMenu.editingPresentationId,
    },
    actions: {
      setLibrariesView: () => { setLibraryPanelView('libraries'); },
      setPlaylistView: () => { setLibraryPanelView('playlist'); },
      renameSegment: (segmentId: string, name: string) => { void renameSegment(segmentId, name); },
      renameContentItem: (itemId: string, title: string) => { void renameContentItem(itemId, title); },
      handleLibraryContextMenu: contextMenu.handleLibraryContextMenu,
      handlePlaylistContextMenu: contextMenu.handlePlaylistContextMenu,
      handleSegmentContextMenu: contextMenu.handleSegmentContextMenu,
      handleSegmentPresentationContextMenu: contextMenu.handleSegmentPresentationContextMenu,
      openPlaylistMenuFromButton: contextMenu.openPlaylistMenuFromButton,
      openSegmentMenuFromButton: contextMenu.openSegmentMenuFromButton,
      openSegmentPresentationMenuFromButton: contextMenu.openSegmentPresentationMenuFromButton,
      clearEditingLibrary: contextMenu.clearEditingLibrary,
      clearEditingPlaylist: contextMenu.clearEditingPlaylist,
      clearEditingSegment: contextMenu.clearEditingSegment,
      clearEditingPresentation: contextMenu.clearEditingPresentation,
      closeMenu: contextMenu.closeMenu,
    },
  }), [contextMenu, renameContentItem, renameSegment, selectedTree, setLibraryPanelView]);

  return <LibraryBrowserContext.Provider value={value}>{children}</LibraryBrowserContext.Provider>;
}

export function useLibraryBrowser(): LibraryBrowserContextValue {
  const context = useContext(LibraryBrowserContext);
  if (!context) throw new Error('useLibraryBrowser must be used within LibraryBrowserProvider');
  return context;
}

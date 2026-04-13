import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { PlaylistTree } from '@core/types';
import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryPanelContextMenu, type EditingTarget } from './use-library-panel-context-menu';
import { useLibraryPanelManagement } from './use-library-panel-management';
import { useLibraryPanelState } from './library-panel-context';

interface LibraryBrowserContextValue {
  state: {
    selectedTree: PlaylistTree | null;
    menuState: ReturnType<typeof useLibraryPanelContextMenu>['menuState'];
    menuItems: ReturnType<typeof useLibraryPanelContextMenu>['menuItems'];
    editingTarget: EditingTarget;
  };
  actions: {
    setLibrariesView: () => void;
    setPlaylistView: () => void;
    renameSegment: (segmentId: string, name: string) => void;
    renameDeckItem: (itemId: string, title: string) => void;
    isEditing: (type: NonNullable<EditingTarget>['type'], id: string) => boolean;
    clearEditing: () => void;
    handleLibraryContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handleLibraryContextMenu'];
    handlePlaylistContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handlePlaylistContextMenu'];
    handleSegmentContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handleSegmentContextMenu'];
    handleSegmentPresentationContextMenu: ReturnType<typeof useLibraryPanelContextMenu>['handleSegmentPresentationContextMenu'];
    openPlaylistMenuFromButton: ReturnType<typeof useLibraryPanelContextMenu>['openPlaylistMenuFromButton'];
    openSegmentMenuFromButton: ReturnType<typeof useLibraryPanelContextMenu>['openSegmentMenuFromButton'];
    openSegmentPresentationMenuFromButton: ReturnType<typeof useLibraryPanelContextMenu>['openSegmentPresentationMenuFromButton'];
    closeMenu: ReturnType<typeof useLibraryPanelContextMenu>['closeMenu'];
  };
}

const LibraryBrowserContext = createContext<LibraryBrowserContextValue | null>(null);

export function LibraryBrowserProvider({ children }: { children: ReactNode }) {
  const { currentLibraryBundle, currentPlaylistId, clearRecentlyCreated } = useNavigation();
  const { libraryPanelView, setLibraryPanelView } = useLibraryPanelState();
  const { renameSegment, renameDeckItem } = useLibraryPanelManagement();
  const contextMenu = useLibraryPanelContextMenu();
  const { clearEditing } = contextMenu;

  const selectedTree = currentLibraryBundle?.playlists.find((playlist) => playlist.playlist.id === currentPlaylistId) ?? null;

  useEffect(() => {
    if (libraryPanelView === 'libraries') return;
    clearEditing();
    clearRecentlyCreated();
  }, [clearEditing, clearRecentlyCreated, libraryPanelView]);

  const value = useMemo<LibraryBrowserContextValue>(() => ({
    state: {
      selectedTree,
      menuState: contextMenu.menuState,
      menuItems: contextMenu.menuItems,
      editingTarget: contextMenu.editingTarget,
    },
    actions: {
      setLibrariesView: () => { setLibraryPanelView('libraries'); },
      setPlaylistView: () => { setLibraryPanelView('playlist'); },
      renameSegment: (segmentId: string, name: string) => { void renameSegment(segmentId, name); },
      renameDeckItem: (itemId: string, title: string) => { void renameDeckItem(itemId, title); },
      isEditing: contextMenu.isEditing,
      clearEditing: contextMenu.clearEditing,
      handleLibraryContextMenu: contextMenu.handleLibraryContextMenu,
      handlePlaylistContextMenu: contextMenu.handlePlaylistContextMenu,
      handleSegmentContextMenu: contextMenu.handleSegmentContextMenu,
      handleSegmentPresentationContextMenu: contextMenu.handleSegmentPresentationContextMenu,
      openPlaylistMenuFromButton: contextMenu.openPlaylistMenuFromButton,
      openSegmentMenuFromButton: contextMenu.openSegmentMenuFromButton,
      openSegmentPresentationMenuFromButton: contextMenu.openSegmentPresentationMenuFromButton,
      closeMenu: contextMenu.closeMenu,
    },
  }), [contextMenu, renameDeckItem, renameSegment, selectedTree, setLibraryPanelView]);

  return <LibraryBrowserContext.Provider value={value}>{children}</LibraryBrowserContext.Provider>;
}

export function useLibraryBrowser(): LibraryBrowserContextValue {
  const context = useContext(LibraryBrowserContext);
  if (!context) throw new Error('useLibraryBrowser must be used within LibraryBrowserProvider');
  return context;
}

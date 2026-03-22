import { useEffect } from 'react';
import { ContextMenu } from '../../../components/context-menu';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useSlides } from '../../../contexts/slide-context';
import { PanelRoute } from '../../workbench/components/panel-route';
import { useLibraryPanelState } from '../contexts/library-panel-context';
import { useLibraryPanelContextMenu } from '../hooks/use-library-panel-context-menu';
import { useLibraryPanelManagement } from '../hooks/use-library-panel-management';
import { LibraryHeader } from './library-header';
import { LibrarySelector } from './library-selector';
import { PlaylistItemList } from './playlist-item-list';
import { PlaylistList } from './playlist-list';

export function LibraryPanel() {
  const { currentLibraryBundle, currentLibraryId, currentPlaylistId, clearRecentlyCreated } = useNavigation();
  const { contentItems } = useProjectContent();
  const { selectPlaylistContentItem } = useSlides();
  const { libraryPanelView, setLibraryPanelView } = useLibraryPanelState();
  const {
    renameSegment,
    renameContentItem,
    deleteLibrary,
    deletePlaylist,
    deleteSegment,
    deleteContentItem,
    movePlaylist,
    moveContentItem,
    setSegmentColor,
    moveContentItemToSegment,
    addContentItemToSegment,
    createDeckInSegment,
    createLyricInSegment
  } = useLibraryPanelManagement();

  const selectedTree = currentLibraryBundle?.playlists.find((playlist) => playlist.playlist.id === currentPlaylistId) ?? null;
  const playlistIds = currentLibraryBundle?.playlists.map((playlist) => playlist.playlist.id) ?? [];
  const contentItemIds = contentItems.map((item) => item.id);

  function handleRenameSegment(segmentId: string, name: string) { void renameSegment(segmentId, name); }
  function handleRenameContentItem(itemId: string, title: string) { void renameContentItem(itemId, title); }

  const {
    menuState,
    menuItems,
    editingLibraryId,
    editingPlaylistId,
    editingSegmentId,
    editingPresentationId,
    handleLibraryContextMenu,
    handlePlaylistContextMenu,
    handleSegmentContextMenu,
    handleSegmentPresentationContextMenu,
    openPlaylistMenuFromButton,
    openSegmentMenuFromButton,
    openSegmentPresentationMenuFromButton,
    closeMenu,
    clearEditingLibrary,
    clearEditingPlaylist,
    clearEditingSegment,
    clearEditingPresentation
  } = useLibraryPanelContextMenu({
    currentLibraryId,
    currentPlaylistId,
    selectedTree,
    libraryContentItems: contentItems,
    playlistIds,
    contentItemIds,
    setLibraryPanelView,
    selectPlaylistContentItem,
    deleteLibrary,
    deletePlaylist,
    deleteSegment,
    deleteContentItem,
    movePlaylist,
    moveContentItem,
    setSegmentColor,
    addContentItemToSegment,
    moveContentItemToSegment,
    createDeckInSegment,
    createLyricInSegment
  });

  useEffect(() => {
    if (libraryPanelView === 'libraries') return;
    clearEditingLibrary();
    clearRecentlyCreated();
  }, [clearEditingLibrary, clearRecentlyCreated, libraryPanelView]);

  return (
    <aside
      data-ui-region="library-panel"
      className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border-primary bg-primary"
    >
      {libraryPanelView === 'libraries' ? (
        <LibrarySelector
          editingLibraryId={editingLibraryId}
          onLibraryContextMenu={handleLibraryContextMenu}
          onClearEditingLibrary={clearEditingLibrary}
        />
      ) : null}

      {libraryPanelView === 'playlist' ? (
        <>
          <LibraryHeader />
          <PanelRoute.Split splitId="library-panel" orientation="vertical" className="flex-1">
            <PanelRoute.Panel id="library-playlists" defaultSize={200} minSize={120}>
              <PlaylistList
                editingPlaylistId={editingPlaylistId}
                onPlaylistContextMenu={handlePlaylistContextMenu}
                onPlaylistMenuButtonClick={openPlaylistMenuFromButton}
                onClearEditingPlaylist={clearEditingPlaylist}
              />
            </PanelRoute.Panel>
            <PanelRoute.Panel id="library-segments" defaultSize={320} minSize={180}>
              <PlaylistItemList
                tree={selectedTree}
                editingSegmentId={editingSegmentId}
                editingPresentationId={editingPresentationId}
                onSegmentContextMenu={handleSegmentContextMenu}
                onSegmentMenuButtonClick={openSegmentMenuFromButton}
                onSegmentPresentationContextMenu={handleSegmentPresentationContextMenu}
                onSegmentPresentationMenuButtonClick={openSegmentPresentationMenuFromButton}
                onRenameSegment={handleRenameSegment}
                onRenamePresentation={handleRenameContentItem}
                onClearEditingSegment={clearEditingSegment}
                onClearEditingPresentation={clearEditingPresentation}
              />
            </PanelRoute.Panel>
          </PanelRoute.Split>
        </>
      ) : null}

      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </aside>
  );
}

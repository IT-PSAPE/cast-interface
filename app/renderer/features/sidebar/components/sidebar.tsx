import { ContextMenu } from '../../../components/context-menu';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSidebarContextMenu } from '../hooks/use-sidebar-context-menu';
import { useSidebarManagement } from '../hooks/use-sidebar-management';
import { LibraryHeader } from './library-header';
import { LibraryPresentationList } from './library-presentation-list';
import { LibrarySelector } from './library-selector';
import { PlaylistItemList } from './playlist-item-list';
import { PlaylistList } from './playlist-list';

export function Sidebar() {
  const { sidebarStage, activeBundle, currentLibraryId, currentPlaylistId, openPresentation, setSidebarStage } = useNavigation();
  const {
    renameSegment,
    renamePresentation,
    deleteLibrary,
    deletePlaylist,
    deleteSegment,
    deletePresentation,
    movePlaylist,
    movePresentation,
    setSegmentColor,
    movePresentationToSegment,
    addPresentationToSegment,
    createPresentationInSegment
  } = useSidebarManagement();

  const selectedTree = activeBundle?.playlists.find((playlist) => playlist.playlist.id === currentPlaylistId) ?? null;
  const playlistIds = activeBundle?.playlists.map((playlist) => playlist.playlist.id) ?? [];
  const presentationIds = activeBundle?.presentations.map((presentation) => presentation.id) ?? [];

  function handleRenameSegment(segmentId: string, name: string) { void renameSegment(segmentId, name); }
  function handleRenamePresentation(presentationId: string, title: string) { void renamePresentation(presentationId, title); }

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
    handleLibraryPresentationContextMenu,
    handleSegmentPresentationContextMenu,
    openPlaylistMenuFromButton,
    openSegmentMenuFromButton,
    openLibraryPresentationMenuFromButton,
    openSegmentPresentationMenuFromButton,
    closeMenu,
    clearEditingLibrary,
    clearEditingPlaylist,
    clearEditingSegment,
    clearEditingPresentation
  } = useSidebarContextMenu({
    currentLibraryId,
    currentPlaylistId,
    selectedTree,
    libraryPresentations: activeBundle?.presentations ?? [],
    playlistIds,
    presentationIds,
    setSidebarStage,
    openPresentation,
    deleteLibrary,
    deletePlaylist,
    deleteSegment,
    deletePresentation,
    movePlaylist,
    movePresentation,
    setSegmentColor,
    addPresentationToSegment,
    movePresentationToSegment,
    createPresentationInSegment
  });

  return (
    <aside className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,2fr)_minmax(0,1fr)] overflow-hidden border-r border-stroke bg-surface-1">
      {sidebarStage === 'libraries' ? (
        <LibrarySelector
          editingLibraryId={editingLibraryId}
          onLibraryContextMenu={handleLibraryContextMenu}
          onClearEditingLibrary={clearEditingLibrary}
        />
      ) : null}

      {sidebarStage === 'playlists' ? (
        <>
          <LibraryHeader />
          <PlaylistList
            editingPlaylistId={editingPlaylistId}
            onPlaylistContextMenu={handlePlaylistContextMenu}
            onPlaylistMenuButtonClick={openPlaylistMenuFromButton}
            onClearEditingPlaylist={clearEditingPlaylist}
          />
          <PlaylistItemList
            tree={selectedTree}
            editingSegmentId={editingSegmentId}
            editingPresentationId={editingPresentationId}
            onSegmentContextMenu={handleSegmentContextMenu}
            onSegmentMenuButtonClick={openSegmentMenuFromButton}
            onSegmentPresentationContextMenu={handleSegmentPresentationContextMenu}
            onSegmentPresentationMenuButtonClick={openSegmentPresentationMenuFromButton}
            onRenameSegment={handleRenameSegment}
            onRenamePresentation={handleRenamePresentation}
            onClearEditingSegment={clearEditingSegment}
            onClearEditingPresentation={clearEditingPresentation}
          />
          <LibraryPresentationList
            editingPresentationId={editingPresentationId}
            onLibraryPresentationContextMenu={handleLibraryPresentationContextMenu}
            onLibraryPresentationMenuButtonClick={openLibraryPresentationMenuFromButton}
            onClearEditingPresentation={clearEditingPresentation}
          />
        </>
      ) : null}

      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </aside>
  );
}

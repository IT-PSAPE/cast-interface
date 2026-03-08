import { ContextMenu } from '../../../components/context-menu';
import { TwoPaneVerticalSplit } from '../../../components/resizable-split';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useLibraryPanelState } from '../contexts/library-panel-context';
import { useLibraryPanelContextMenu } from '../hooks/use-library-panel-context-menu';
import { useLibraryPanelManagement } from '../hooks/use-library-panel-management';
import { LibraryHeader } from './library-header';
import { LibrarySelector } from './library-selector';
import { PlaylistItemList } from './playlist-item-list';
import { PlaylistList } from './playlist-list';

export function LibraryPanel() {
  const { currentLibraryBundle, currentLibraryId, currentPlaylistId, openPresentation } = useNavigation();
  const { presentations } = useProjectContent();
  const { libraryPanelView, setLibraryPanelView } = useLibraryPanelState();
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
  } = useLibraryPanelManagement();

  const selectedTree = currentLibraryBundle?.playlists.find((playlist) => playlist.playlist.id === currentPlaylistId) ?? null;
  const playlistIds = currentLibraryBundle?.playlists.map((playlist) => playlist.playlist.id) ?? [];
  const presentationIds = presentations.map((presentation) => presentation.id);

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
    libraryPresentations: presentations,
    playlistIds,
    presentationIds,
    setLibraryPanelView,
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
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border-primary bg-background-primary_alt">
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
          <TwoPaneVerticalSplit
            className="flex-1"
            topPaneId="library-playlists"
            bottomPaneId="library-segments"
            defaultTopSize={200}
            defaultBottomSize={320}
            minTopSize={120}
            minBottomSize={180}
            topPane={(
              <PlaylistList
                editingPlaylistId={editingPlaylistId}
                onPlaylistContextMenu={handlePlaylistContextMenu}
                onPlaylistMenuButtonClick={openPlaylistMenuFromButton}
                onClearEditingPlaylist={clearEditingPlaylist}
              />
            )}
            bottomPane={(
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
            )}
          />
        </>
      ) : null}

      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </aside>
  );
}

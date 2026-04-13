import { useCallback, useMemo, useState } from 'react';
import type { Id } from '@core/types';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useSlides } from '../../contexts/slide-context';
import { useLibraryPanelState } from './library-panel-context';
import { buildLibraryPanelMenuItems } from './library-panel-menu-items';
import { useLibraryPanelManagement } from './use-library-panel-management';
import { useContextMenuState } from '../../hooks/use-context-menu-state';

type LibraryPanelMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'deck-item'; id: Id; scope: 'library' | 'segment' };

export type EditingTarget = { type: 'library' | 'playlist' | 'segment' | 'presentation'; id: string } | null;

export function useLibraryPanelContextMenu() {
  const { currentLibraryBundle, currentLibraryId, currentPlaylistId } = useNavigation();
  const { deckItems } = useProjectContent();
  const { selectPlaylistDeckItem } = useSlides();
  const { setLibraryPanelView } = useLibraryPanelState();
  const { deleteLibrary, deletePlaylist, deleteSegment, deleteDeckItem, movePlaylist, moveDeckItem, setSegmentColor, addDeckItemToSegment, moveDeckItemToSegment, createPresentationInSegment, createLyricInSegment } = useLibraryPanelManagement();
  const menu = useContextMenuState<LibraryPanelMenuTarget>();
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const selectedTree = currentLibraryBundle?.playlists.find((playlist) => playlist.playlist.id === currentPlaylistId) ?? null;
  const playlistIds = currentLibraryBundle?.playlists.map((playlist) => playlist.playlist.id) ?? [];
  const deckItemIds = deckItems.map((item) => item.id);

  const isEditing = useCallback((type: EditingTarget extends null ? never : NonNullable<EditingTarget>['type'], id: string) => {
    return editingTarget?.type === type && editingTarget?.id === id;
  }, [editingTarget]);

  const clearEditing = useCallback(() => setEditingTarget(null), []);

  const beginEditing = useCallback((type: NonNullable<EditingTarget>['type'], id: string) => {
    setEditingTarget({ type, id });
  }, []);

  const menuItems = useMemo(() => {
    if (!menu.menuState) return [];
    return buildLibraryPanelMenuItems({
      target: menu.menuState.data,
      currentLibraryId,
      currentPlaylistId,
      selectedTree,
      libraryDeckItems: deckItems,
      playlistIds,
      deckItemIds,
      setLibraryPanelView,
      selectPlaylistDeckItem,
      deleteLibrary,
      deletePlaylist,
      deleteSegment,
      deleteDeckItem,
      movePlaylist,
      moveDeckItem,
      setSegmentColor,
      addDeckItemToSegment,
      moveDeckItemToSegment,
      createPresentationInSegment,
      createLyricInSegment,
      beginRenameLibrary: (id: Id) => beginEditing('library', id),
      beginRenamePlaylist: (id: Id) => beginEditing('playlist', id),
      beginRenameSegment: (id: Id) => beginEditing('segment', id),
      beginRenamePresentation: (id: Id) => beginEditing('presentation', id),
    });
  }, [menu.menuState, currentLibraryId, currentPlaylistId, selectedTree, deckItems, playlistIds, deckItemIds, setLibraryPanelView, selectPlaylistDeckItem, deleteLibrary, deletePlaylist, deleteSegment, deleteDeckItem, movePlaylist, moveDeckItem, setSegmentColor, addDeckItemToSegment, moveDeckItemToSegment, createPresentationInSegment, createLyricInSegment, beginEditing]);

  return {
    menuState: menu.menuState,
    menuItems,
    editingTarget,
    isEditing,
    beginEditing,
    clearEditing,
    handleLibraryContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => menu.openFromEvent(event, { type: 'library', id }),
    handlePlaylistContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => menu.openFromEvent(event, { type: 'playlist', id }),
    handleSegmentContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => menu.openFromEvent(event, { type: 'segment', id }),
    handleSegmentPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => menu.openFromEvent(event, { type: 'deck-item', id, scope: 'segment' }),
    openPlaylistMenuFromButton: (id: string, button: HTMLElement) => menu.openFromButton(button, { type: 'playlist', id }),
    openSegmentMenuFromButton: (id: string, button: HTMLElement) => menu.openFromButton(button, { type: 'segment', id }),
    openSegmentPresentationMenuFromButton: (id: string, button: HTMLElement) => menu.openFromButton(button, { type: 'deck-item', id, scope: 'segment' }),
    closeMenu: menu.close,
  };
}

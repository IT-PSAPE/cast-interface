import { useMemo, useState } from 'react';
import type { Id } from '@core/types';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useProjectContent } from '../../../../contexts/use-project-content';
import { useSlides } from '../../../../contexts/slide-context';
import { useLibraryPanelState } from '../contexts/library-panel-context';
import { buildLibraryPanelMenuItems } from '../utils/library-panel-menu-items';
import { useLibraryPanelManagement } from './use-library-panel-management';

type LibraryPanelMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'content-item'; id: Id; scope: 'library' | 'segment' };

export function useLibraryPanelContextMenu() {
  const { currentLibraryBundle, currentLibraryId, currentPlaylistId } = useNavigation();
  const { contentItems } = useProjectContent();
  const { selectPlaylistContentItem } = useSlides();
  const { setLibraryPanelView } = useLibraryPanelState();
  const { deleteLibrary, deletePlaylist, deleteSegment, deleteContentItem, movePlaylist, moveContentItem, setSegmentColor, addContentItemToSegment, moveContentItemToSegment, createDeckInSegment, createLyricInSegment } = useLibraryPanelManagement();
  const [menuState, setMenuState] = useState<{ x: number; y: number; target: LibraryPanelMenuTarget } | null>(null);
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);
  const selectedTree = currentLibraryBundle?.playlists.find((playlist) => playlist.playlist.id === currentPlaylistId) ?? null;
  const playlistIds = currentLibraryBundle?.playlists.map((playlist) => playlist.playlist.id) ?? [];
  const contentItemIds = contentItems.map((item) => item.id);

  function openMenuAt(target: LibraryPanelMenuTarget, x: number, y: number) {
    setMenuState({ x, y, target });
  }

  function handleOpenContextMenu(event: React.MouseEvent<HTMLElement>, target: LibraryPanelMenuTarget) {
    event.preventDefault();
    openMenuAt(target, event.clientX, event.clientY);
  }

  function openMenuFromButton(target: LibraryPanelMenuTarget, button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    openMenuAt(target, rect.right + 6, rect.top);
  }

  const menuItems = useMemo(() => {
    if (!menuState) return [];
    return buildLibraryPanelMenuItems({
      target: menuState.target,
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
      createLyricInSegment,
      beginRenameLibrary: setEditingLibraryId,
      beginRenamePlaylist: setEditingPlaylistId,
      beginRenameSegment: setEditingSegmentId,
      beginRenamePresentation: setEditingPresentationId
    });
  }, [menuState, currentLibraryId, currentPlaylistId, selectedTree, contentItems, playlistIds, contentItemIds, setLibraryPanelView, selectPlaylistContentItem, deleteLibrary, deletePlaylist, deleteSegment, deleteContentItem, movePlaylist, moveContentItem, setSegmentColor, addContentItemToSegment, moveContentItemToSegment, createDeckInSegment, createLyricInSegment]);

  return {
    menuState,
    menuItems,
    editingLibraryId,
    editingPlaylistId,
    editingSegmentId,
    editingPresentationId,
    handleLibraryContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => handleOpenContextMenu(event, { type: 'library', id }),
    handlePlaylistContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => handleOpenContextMenu(event, { type: 'playlist', id }),
    handleSegmentContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => handleOpenContextMenu(event, { type: 'segment', id }),
    handleLibraryPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => handleOpenContextMenu(event, { type: 'content-item', id, scope: 'library' }),
    handleSegmentPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => handleOpenContextMenu(event, { type: 'content-item', id, scope: 'segment' }),
    openPlaylistMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'playlist', id }, button),
    openSegmentMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'segment', id }, button),
    openLibraryPresentationMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'content-item', id, scope: 'library' }, button),
    openSegmentPresentationMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'content-item', id, scope: 'segment' }, button),
    closeMenu: () => setMenuState(null),
    clearEditingLibrary: () => setEditingLibraryId(null),
    clearEditingPlaylist: () => setEditingPlaylistId(null),
    clearEditingSegment: () => setEditingSegmentId(null),
    clearEditingPresentation: () => setEditingPresentationId(null)
  };
}

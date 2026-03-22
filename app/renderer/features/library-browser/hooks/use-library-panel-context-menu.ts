import { useMemo, useState } from 'react';
import type { ContentItem, Id, PlaylistTree } from '@core/types';
import type { LibraryPanelView } from '../../../types/ui';
import { buildLibraryPanelMenuItems } from '../utils/library-panel-menu-items';

type LibraryPanelMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'content-item'; id: Id; scope: 'library' | 'segment' };

interface LibraryPanelContextMenuOptions {
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  selectedTree: PlaylistTree | null;
  libraryContentItems: ContentItem[];
  playlistIds: Id[];
  contentItemIds: Id[];
  setLibraryPanelView: (stage: LibraryPanelView) => void;
  selectPlaylistContentItem: (id: Id) => void;
  deleteLibrary: (id: Id) => Promise<void>;
  deletePlaylist: (id: Id) => Promise<void>;
  deleteSegment: (id: Id) => Promise<void>;
  deleteContentItem: (id: Id) => Promise<void>;
  movePlaylist: (id: Id, direction: 'up' | 'down') => Promise<void>;
  moveContentItem: (id: Id, direction: 'up' | 'down') => Promise<void>;
  setSegmentColor: (id: Id, colorKey: string | null) => Promise<void>;
  addContentItemToSegment: (segmentId: Id, itemId: Id) => Promise<void>;
  moveContentItemToSegment: (playlistId: Id, itemId: Id, segmentId: Id | null) => Promise<void>;
  createDeckInSegment: (libraryId: Id, segmentId: Id) => Promise<Id | null>;
  createLyricInSegment: (libraryId: Id, segmentId: Id) => Promise<Id | null>;
}

export function useLibraryPanelContextMenu({ currentLibraryId, currentPlaylistId, selectedTree, libraryContentItems, playlistIds, contentItemIds, setLibraryPanelView, selectPlaylistContentItem, deleteLibrary, deletePlaylist, deleteSegment, deleteContentItem, movePlaylist, moveContentItem, setSegmentColor, addContentItemToSegment, moveContentItemToSegment, createDeckInSegment, createLyricInSegment }: LibraryPanelContextMenuOptions) {
  const [menuState, setMenuState] = useState<{ x: number; y: number; target: LibraryPanelMenuTarget } | null>(null);
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);

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
      libraryContentItems,
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
  }, [menuState, currentLibraryId, currentPlaylistId, selectedTree, libraryContentItems, playlistIds, contentItemIds, setLibraryPanelView, selectPlaylistContentItem, deleteLibrary, deletePlaylist, deleteSegment, deleteContentItem, movePlaylist, moveContentItem, setSegmentColor, addContentItemToSegment, moveContentItemToSegment, createDeckInSegment, createLyricInSegment]);

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

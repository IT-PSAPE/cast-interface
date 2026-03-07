import { useMemo, useState } from 'react';
import type { Id, PlaylistTree, Presentation } from '@core/types';
import type { LibraryPanelView } from '../../../types/ui';
import { buildLibraryPanelMenuItems } from '../utils/library-panel-menu-items';

type LibraryPanelMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'presentation'; id: Id; scope: 'library' | 'segment' };

interface LibraryPanelContextMenuOptions {
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  selectedTree: PlaylistTree | null;
  libraryPresentations: Presentation[];
  playlistIds: Id[];
  presentationIds: Id[];
  setLibraryPanelView: (stage: LibraryPanelView) => void;
  openPresentation: (id: Id) => void;
  deleteLibrary: (id: Id) => Promise<void>;
  deletePlaylist: (id: Id) => Promise<void>;
  deleteSegment: (id: Id) => Promise<void>;
  deletePresentation: (id: Id) => Promise<void>;
  movePlaylist: (id: Id, direction: 'up' | 'down') => Promise<void>;
  movePresentation: (id: Id, direction: 'up' | 'down') => Promise<void>;
  setSegmentColor: (id: Id, colorKey: string | null) => Promise<void>;
  addPresentationToSegment: (segmentId: Id, presentationId: Id) => Promise<void>;
  movePresentationToSegment: (playlistId: Id, presentationId: Id, segmentId: Id | null) => Promise<void>;
  createPresentationInSegment: (libraryId: Id, segmentId: Id) => Promise<Id | null>;
}

export function useLibraryPanelContextMenu({ currentLibraryId, currentPlaylistId, selectedTree, libraryPresentations, playlistIds, presentationIds, setLibraryPanelView, openPresentation, deleteLibrary, deletePlaylist, deleteSegment, deletePresentation, movePlaylist, movePresentation, setSegmentColor, addPresentationToSegment, movePresentationToSegment, createPresentationInSegment }: LibraryPanelContextMenuOptions) {
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
      libraryPresentations,
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
      createPresentationInSegment,
      beginRenameLibrary: setEditingLibraryId,
      beginRenamePlaylist: setEditingPlaylistId,
      beginRenameSegment: setEditingSegmentId,
      beginRenamePresentation: setEditingPresentationId
    });
  }, [menuState, currentLibraryId, currentPlaylistId, selectedTree, libraryPresentations, playlistIds, presentationIds, setLibraryPanelView, openPresentation, deleteLibrary, deletePlaylist, deleteSegment, deletePresentation, movePlaylist, movePresentation, setSegmentColor, addPresentationToSegment, movePresentationToSegment, createPresentationInSegment]);

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
    handleLibraryPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => handleOpenContextMenu(event, { type: 'presentation', id, scope: 'library' }),
    handleSegmentPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, id: string) => handleOpenContextMenu(event, { type: 'presentation', id, scope: 'segment' }),
    openPlaylistMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'playlist', id }, button),
    openSegmentMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'segment', id }, button),
    openLibraryPresentationMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'presentation', id, scope: 'library' }, button),
    openSegmentPresentationMenuFromButton: (id: string, button: HTMLElement) => openMenuFromButton({ type: 'presentation', id, scope: 'segment' }, button),
    closeMenu: () => setMenuState(null),
    clearEditingLibrary: () => setEditingLibraryId(null),
    clearEditingPlaylist: () => setEditingPlaylistId(null),
    clearEditingSegment: () => setEditingSegmentId(null),
    clearEditingPresentation: () => setEditingPresentationId(null)
  };
}

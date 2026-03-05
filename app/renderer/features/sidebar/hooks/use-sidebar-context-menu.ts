import { useMemo, useState } from 'react';
import type { Id, PlaylistTree, Presentation } from '@core/types';
import type { SidebarStage } from '../../../types/ui';
import { buildSidebarMenuItems } from '../utils/sidebar-menu-items';

type SidebarMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'presentation'; id: Id; scope: 'library' | 'segment' };

interface SidebarContextMenuOptions {
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  selectedTree: PlaylistTree | null;
  libraryPresentations: Presentation[];
  playlistIds: Id[];
  presentationIds: Id[];
  setSidebarStage: (stage: SidebarStage) => void;
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

export function useSidebarContextMenu({ currentLibraryId, currentPlaylistId, selectedTree, libraryPresentations, playlistIds, presentationIds, setSidebarStage, openPresentation, deleteLibrary, deletePlaylist, deleteSegment, deletePresentation, movePlaylist, movePresentation, setSegmentColor, addPresentationToSegment, movePresentationToSegment, createPresentationInSegment }: SidebarContextMenuOptions) {
  const [menuState, setMenuState] = useState<{ x: number; y: number; target: SidebarMenuTarget } | null>(null);
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);

  function openMenuAt(target: SidebarMenuTarget, x: number, y: number) {
    setMenuState({ x, y, target });
  }

  function handleOpenContextMenu(event: React.MouseEvent<HTMLElement>, target: SidebarMenuTarget) {
    event.preventDefault();
    openMenuAt(target, event.clientX, event.clientY);
  }

  function openMenuFromButton(target: SidebarMenuTarget, button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    openMenuAt(target, rect.right + 6, rect.top);
  }

  const menuItems = useMemo(() => {
    if (!menuState) return [];
    return buildSidebarMenuItems({
      target: menuState.target,
      currentLibraryId,
      currentPlaylistId,
      selectedTree,
      libraryPresentations,
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
      createPresentationInSegment,
      beginRenameLibrary: setEditingLibraryId,
      beginRenamePlaylist: setEditingPlaylistId,
      beginRenameSegment: setEditingSegmentId,
      beginRenamePresentation: setEditingPresentationId
    });
  }, [menuState, currentLibraryId, currentPlaylistId, selectedTree, libraryPresentations, playlistIds, presentationIds, setSidebarStage, openPresentation, deleteLibrary, deletePlaylist, deleteSegment, deletePresentation, movePlaylist, movePresentation, setSegmentColor, addPresentationToSegment, movePresentationToSegment, createPresentationInSegment]);

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

import { createElement } from 'react';
import type { Id, PlaylistTree, Presentation } from '@core/types';
import type { ContextMenuItem } from '../../../components/context-menu';
import { PresentationEntityIcon } from '../../../components/presentation-entity-icon';
import type { LibraryPanelView } from '../../../types/ui';
import { buildCreatePresentationMenuItems } from '../../../utils/build-create-presentation-menu-items';
import { buildPresentationMenuItems } from './build-presentation-menu-items';
import { SEGMENT_COLOR_OPTIONS } from './segment-header-color';

type LibraryPanelMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'presentation'; id: Id; scope: 'library' | 'segment' };

interface BuildMenuItemsOptions {
  target: LibraryPanelMenuTarget;
  currentLibraryId: Id | null;
  currentPlaylistId: Id | null;
  selectedTree: PlaylistTree | null;
  libraryPresentations: Presentation[];
  playlistIds: Id[];
  presentationIds: Id[];
  setLibraryPanelView: (stage: LibraryPanelView) => void;
  selectPlaylistPresentation: (id: Id) => void;
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
  createLyricInSegment: (libraryId: Id, segmentId: Id) => Promise<Id | null>;
  beginRenameLibrary: (id: Id) => void;
  beginRenamePlaylist: (id: Id) => void;
  beginRenameSegment: (id: Id) => void;
  beginRenamePresentation: (id: Id) => void;
}

export function buildLibraryPanelMenuItems(options: BuildMenuItemsOptions): ContextMenuItem[] {
  const { target, currentLibraryId, currentPlaylistId, selectedTree, libraryPresentations, playlistIds, presentationIds, setLibraryPanelView, selectPlaylistPresentation, deleteLibrary, deletePlaylist, deleteSegment, deletePresentation, movePlaylist, movePresentation, setSegmentColor, addPresentationToSegment, movePresentationToSegment, createPresentationInSegment, createLyricInSegment, beginRenameLibrary, beginRenamePlaylist, beginRenameSegment, beginRenamePresentation } = options;

  if (target.type === 'library') {
    return [
      { id: 'rename-library', label: 'Rename', onSelect: () => beginRenameLibrary(target.id) },
      {
        id: 'delete-library',
        label: 'Delete',
        danger: true,
        onSelect: () => {
          if (!window.confirm('Delete this library and its playlists? Project presentations and lyrics, media, and overlays will remain.')) return;
          void deleteLibrary(target.id);
          setLibraryPanelView('libraries');
        }
      }
    ];
  }

  if (target.type === 'playlist') {
    const currentIndex = playlistIds.indexOf(target.id);
    return [
      { id: 'rename-playlist', label: 'Rename', onSelect: () => beginRenamePlaylist(target.id) },
      { id: 'playlist-up', label: 'Move Up', disabled: currentIndex <= 0, onSelect: () => { void movePlaylist(target.id, 'up'); } },
      { id: 'playlist-down', label: 'Move Down', disabled: currentIndex < 0 || currentIndex >= playlistIds.length - 1, onSelect: () => { void movePlaylist(target.id, 'down'); } },
      {
        id: 'delete-playlist',
        label: 'Delete',
        danger: true,
        onSelect: () => {
          if (!window.confirm('Delete this playlist?')) return;
          void deletePlaylist(target.id);
        }
      }
    ];
  }

  if (target.type === 'segment') {
    const selectedSegmentColorKey = selectedTree?.segments.find((segment) => segment.segment.id === target.id)?.segment.colorKey ?? null;
    const addPresentationChildren = libraryPresentations.map((presentation) => ({
      id: `add-presentation-${presentation.id}`,
      label: presentation.title,
      icon: createElement(PresentationEntityIcon, { entity: presentation, size: 14, strokeWidth: 1.75 }),
      onSelect: () => {
        void addPresentationToSegment(target.id, presentation.id);
        selectPlaylistPresentation(presentation.id);
      }
    }));
    const colorChildren: ContextMenuItem[] = SEGMENT_COLOR_OPTIONS.map((option) => ({
      id: `segment-color-${option.key}`,
      label: option.label,
      swatchColor: option.swatch,
      selected: selectedSegmentColorKey === option.key,
      onSelect: () => { void setSegmentColor(target.id, option.key); }
    }));
    colorChildren.push({
      id: 'segment-color-remove',
      label: 'Remove color',
      onSelect: () => { void setSegmentColor(target.id, null); }
    });

    return [
      { id: 'rename-segment', label: 'Rename', onSelect: () => beginRenameSegment(target.id) },
      {
        id: 'segment-choose-color',
        label: 'Choose Color',
        childrenLayout: 'color-grid',
        children: colorChildren
      },
      {
        id: 'segment-add-presentation',
        label: 'Add Existing',
        disabled: addPresentationChildren.length === 0,
        children: addPresentationChildren
      },
      {
        id: 'segment-add-new-presentation',
        label: 'Add New',
        disabled: !currentLibraryId,
        children: currentLibraryId ? buildCreatePresentationMenuItems({
          createPresentation: async () => {
            const createdPresentationId = await createPresentationInSegment(currentLibraryId, target.id);
            if (!createdPresentationId) return;
            selectPlaylistPresentation(createdPresentationId);
          },
          createLyric: async () => {
            const createdPresentationId = await createLyricInSegment(currentLibraryId, target.id);
            if (!createdPresentationId) return;
            selectPlaylistPresentation(createdPresentationId);
          }
        }) : []
      },
      {
        id: 'delete-segment',
        label: 'Delete',
        danger: true,
        onSelect: () => {
          if (!window.confirm('Delete this segment?')) return;
          void deleteSegment(target.id);
        }
      }
    ];
  }

  return buildPresentationMenuItems({
    presentationId: target.id,
    scope: target.scope,
    currentPlaylistId,
    selectedTree,
    presentationIds,
    selectPresentation: selectPlaylistPresentation,
    movePresentation,
    movePresentationToSegment,
    beginRenamePresentation,
    deletePresentation,
  });
}

import { createElement } from 'react';
import type { DeckItem, Id, PlaylistTree } from '@core/types';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { DeckItemIcon } from '../../components/display/entity-icon';
import type { LibraryPanelView } from '../../types/ui';
import { buildCreateContentMenuItems } from '../../utils/build-create-presentation-menu-items';
import { buildDeckItemMenuItems } from './build-presentation-menu-items';
import { SEGMENT_COLOR_OPTIONS } from './segment-header-color';

type LibraryPanelMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'deck-item'; itemId: Id; entryId?: Id; scope: 'library' | 'segment' };

interface BuildMenuItemsOptions {
  target: LibraryPanelMenuTarget;
  currentLibraryId: Id | null;
  selectedTree: PlaylistTree | null;
  libraryDeckItems: DeckItem[];
  playlistIds: Id[];
  deckItemIds: Id[];
  setLibraryPanelView: (stage: LibraryPanelView) => void;
  selectPlaylistDeckItem: (id: Id) => void;
  selectPlaylistEntry: (entryId: Id) => void;
  deleteLibrary: (id: Id) => Promise<void>;
  deletePlaylist: (id: Id) => Promise<void>;
  deleteSegment: (id: Id) => Promise<void>;
  deleteDeckItem: (id: Id) => Promise<void>;
  movePlaylist: (id: Id, direction: 'up' | 'down') => Promise<void>;
  moveDeckItem: (id: Id, direction: 'up' | 'down') => Promise<void>;
  setSegmentColor: (id: Id, colorKey: string | null) => Promise<void>;
  addDeckItemToSegment: (segmentId: Id, itemId: Id) => Promise<Id | null>;
  movePlaylistEntryToSegment: (entryId: Id, segmentId: Id | null) => Promise<void>;
  createPresentationInSegment: (libraryId: Id, segmentId: Id) => Promise<Id | null>;
  createLyricInSegment: (libraryId: Id, segmentId: Id) => Promise<Id | null>;
  beginRenameLibrary: (id: Id) => void;
  beginRenamePlaylist: (id: Id) => void;
  beginRenameSegment: (id: Id) => void;
  beginRenamePresentation: (id: Id) => void;
}

export function buildLibraryPanelMenuItems(options: BuildMenuItemsOptions): ContextMenuItem[] {
  const { target, currentLibraryId, selectedTree, libraryDeckItems, playlistIds, deckItemIds, setLibraryPanelView, selectPlaylistDeckItem, selectPlaylistEntry, deleteLibrary, deletePlaylist, deleteSegment, deleteDeckItem, movePlaylist, moveDeckItem, setSegmentColor, addDeckItemToSegment, movePlaylistEntryToSegment, createPresentationInSegment, createLyricInSegment, beginRenameLibrary, beginRenamePlaylist, beginRenameSegment, beginRenamePresentation } = options;

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
    const addPresentationChildren = libraryDeckItems.map((item) => ({
      id: `add-deck-item-${item.id}`,
      label: item.title,
      icon: createElement(DeckItemIcon, { entity: item, size: 14, strokeWidth: 1.75 }),
      onSelect: () => {
        void addDeckItemToSegment(target.id, item.id).then((entryId) => {
          if (entryId) {
            selectPlaylistEntry(entryId);
            return;
          }

          selectPlaylistDeckItem(item.id);
        });
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
        children: currentLibraryId ? buildCreateContentMenuItems({
          createPresentation: async () => {
            const createdItemId = await createPresentationInSegment(currentLibraryId, target.id);
            if (!createdItemId) return;
            selectPlaylistDeckItem(createdItemId);
          },
          createEmptyLyric: async () => {
            const createdItemId = await createLyricInSegment(currentLibraryId, target.id);
            if (!createdItemId) return;
            selectPlaylistDeckItem(createdItemId);
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

  return buildDeckItemMenuItems({
    entryId: target.entryId,
    itemId: target.itemId,
    scope: target.scope,
    selectedTree,
    itemIds: deckItemIds,
    selectPlaylistEntry,
    moveDeckItem,
    movePlaylistEntryToSegment,
    beginRenameDeckItem: beginRenamePresentation,
    deleteDeckItem,
  });
}

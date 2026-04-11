import { createElement } from 'react';
import type { ContentItem, Id, PlaylistTree } from '@core/types';
import type { ContextMenuItem } from '../../components/overlays/context-menu';
import { ContentItemIcon } from '../../components/display/entity-icon';
import type { LibraryPanelView } from '../../types/ui';
import { buildCreateContentMenuItems } from '../../utils/build-create-presentation-menu-items';
import { buildContentItemMenuItems } from './build-presentation-menu-items';
import { SEGMENT_COLOR_OPTIONS } from './segment-header-color';

type LibraryPanelMenuTarget =
  | { type: 'library'; id: Id }
  | { type: 'playlist'; id: Id }
  | { type: 'segment'; id: Id }
  | { type: 'content-item'; id: Id; scope: 'library' | 'segment' };

interface BuildMenuItemsOptions {
  target: LibraryPanelMenuTarget;
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
  beginRenameLibrary: (id: Id) => void;
  beginRenamePlaylist: (id: Id) => void;
  beginRenameSegment: (id: Id) => void;
  beginRenamePresentation: (id: Id) => void;
}

export function buildLibraryPanelMenuItems(options: BuildMenuItemsOptions): ContextMenuItem[] {
  const { target, currentLibraryId, currentPlaylistId, selectedTree, libraryContentItems, playlistIds, contentItemIds, setLibraryPanelView, selectPlaylistContentItem, deleteLibrary, deletePlaylist, deleteSegment, deleteContentItem, movePlaylist, moveContentItem, setSegmentColor, addContentItemToSegment, moveContentItemToSegment, createDeckInSegment, createLyricInSegment, beginRenameLibrary, beginRenamePlaylist, beginRenameSegment, beginRenamePresentation } = options;

  if (target.type === 'library') {
    return [
      { id: 'rename-library', label: 'Rename', onSelect: () => beginRenameLibrary(target.id) },
      {
        id: 'delete-library',
        label: 'Delete',
        danger: true,
        onSelect: () => {
          if (!window.confirm('Delete this library and its playlists? Project decks and lyrics, media, and overlays will remain.')) return;
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
    const addPresentationChildren = libraryContentItems.map((item) => ({
      id: `add-content-item-${item.id}`,
      label: item.title,
      icon: createElement(ContentItemIcon, { entity: item, size: 14, strokeWidth: 1.75 }),
      onSelect: () => {
        void addContentItemToSegment(target.id, item.id);
        selectPlaylistContentItem(item.id);
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
          createDeck: async () => {
            const createdItemId = await createDeckInSegment(currentLibraryId, target.id);
            if (!createdItemId) return;
            selectPlaylistContentItem(createdItemId);
          },
          createLyric: async () => {
            const createdItemId = await createLyricInSegment(currentLibraryId, target.id);
            if (!createdItemId) return;
            selectPlaylistContentItem(createdItemId);
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

  return buildContentItemMenuItems({
    itemId: target.id,
    scope: target.scope,
    currentPlaylistId,
    selectedTree,
    itemIds: contentItemIds,
    selectContentItem: selectPlaylistContentItem,
    moveContentItem,
    moveContentItemToSegment,
    beginRenameContentItem: beginRenamePresentation,
    deleteContentItem,
  });
}

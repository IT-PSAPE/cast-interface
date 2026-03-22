import type { Id, PlaylistTree } from '@core/types';
import type { ContextMenuItem } from '../../../components/context-menu';

interface BuildPresentationMenuItemsOptions {
  itemId: Id;
  scope: 'library' | 'segment';
  currentPlaylistId: Id | null;
  selectedTree: PlaylistTree | null;
  itemIds: Id[];
  selectContentItem: (id: Id) => void;
  moveContentItem: (id: Id, direction: 'up' | 'down') => Promise<void>;
  moveContentItemToSegment: (playlistId: Id, itemId: Id, segmentId: Id | null) => Promise<void>;
  beginRenameContentItem: (id: Id) => void;
  deleteContentItem: (id: Id) => Promise<void>;
}

export function buildContentItemMenuItems({
  itemId,
  scope,
  currentPlaylistId,
  selectedTree,
  itemIds,
  selectContentItem,
  moveContentItem,
  moveContentItemToSegment,
  beginRenameContentItem,
  deleteContentItem
}: BuildPresentationMenuItemsOptions): ContextMenuItem[] {
  const itemIndex = itemIds.indexOf(itemId);
  const moveUpItem: ContextMenuItem = {
    id: 'content-item-up',
    label: 'Move Up',
    disabled: itemIndex <= 0,
    onSelect: () => { void moveContentItem(itemId, 'up'); }
  };
  const moveDownItem: ContextMenuItem = {
    id: 'content-item-down',
    label: 'Move Down',
    disabled: itemIndex < 0 || itemIndex >= itemIds.length - 1,
    onSelect: () => { void moveContentItem(itemId, 'down'); }
  };
  const deleteItem: ContextMenuItem = {
    id: 'delete-content-item',
    label: 'Delete',
    danger: true,
    onSelect: () => {
      if (!window.confirm('Delete this item?')) return;
      void deleteContentItem(itemId);
    }
  };

  if (scope === 'library') {
    return [
      { id: 'rename-content-item', label: 'Rename', onSelect: () => beginRenameContentItem(itemId) },
      moveUpItem,
      moveDownItem,
      deleteItem
    ];
  }

  const assignedSegmentId = selectedTree?.segments.find((segment) =>
    segment.entries.some((entry) => entry.item.id === itemId)
  )?.segment.id ?? null;
  const moveOptions = (selectedTree?.segments ?? []).map((segment) => ({
    id: `move-${segment.segment.id}`,
    label: segment.segment.name,
    onSelect: () => {
      if (!currentPlaylistId) return;
      void moveContentItemToSegment(currentPlaylistId, itemId, segment.segment.id);
      selectContentItem(itemId);
    }
  }));

  return [
    { id: 'rename-content-item', label: 'Rename', onSelect: () => beginRenameContentItem(itemId) },
    moveUpItem,
    moveDownItem,
    {
      id: 'move-content-item',
      label: 'Move',
      disabled: !currentPlaylistId,
      children: [
        ...moveOptions,
        {
          id: 'move-none',
          label: 'Not in selected playlist',
          onSelect: () => {
            if (!currentPlaylistId) return;
            void moveContentItemToSegment(currentPlaylistId, itemId, null);
            selectContentItem(itemId);
          }
        }
      ]
    },
    {
      id: 'remove-from-segment',
      label: 'Remove',
      disabled: !currentPlaylistId || !assignedSegmentId,
      onSelect: () => {
        if (!currentPlaylistId) return;
        void moveContentItemToSegment(currentPlaylistId, itemId, null);
        selectContentItem(itemId);
      }
    },
    deleteItem
  ];
}

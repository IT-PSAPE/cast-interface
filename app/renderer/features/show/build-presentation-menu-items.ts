import type { Id, PlaylistTree } from '@core/types';
import type { ContextMenuItem } from '../../components/overlays/context-menu';

interface BuildPresentationMenuItemsOptions {
  itemId: Id;
  scope: 'library' | 'segment';
  currentPlaylistId: Id | null;
  selectedTree: PlaylistTree | null;
  itemIds: Id[];
  selectDeckItem: (id: Id) => void;
  moveDeckItem: (id: Id, direction: 'up' | 'down') => Promise<void>;
  moveDeckItemToSegment: (playlistId: Id, itemId: Id, segmentId: Id | null) => Promise<void>;
  beginRenameDeckItem: (id: Id) => void;
  deleteDeckItem: (id: Id) => Promise<void>;
}

export function buildDeckItemMenuItems({
  itemId,
  scope,
  currentPlaylistId,
  selectedTree,
  itemIds,
  selectDeckItem,
  moveDeckItem,
  moveDeckItemToSegment,
  beginRenameDeckItem,
  deleteDeckItem
}: BuildPresentationMenuItemsOptions): ContextMenuItem[] {
  const itemIndex = itemIds.indexOf(itemId);
  const moveUpItem: ContextMenuItem = {
    id: 'deck-item-up',
    label: 'Move Up',
    disabled: itemIndex <= 0,
    onSelect: () => { void moveDeckItem(itemId, 'up'); }
  };
  const moveDownItem: ContextMenuItem = {
    id: 'deck-item-down',
    label: 'Move Down',
    disabled: itemIndex < 0 || itemIndex >= itemIds.length - 1,
    onSelect: () => { void moveDeckItem(itemId, 'down'); }
  };
  const deleteItem: ContextMenuItem = {
    id: 'delete-deck-item',
    label: 'Delete',
    danger: true,
    onSelect: () => {
      if (!window.confirm('Delete this item?')) return;
      void deleteDeckItem(itemId);
    }
  };

  if (scope === 'library') {
    return [
      { id: 'rename-deck-item', label: 'Rename', onSelect: () => beginRenameDeckItem(itemId) },
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
      void moveDeckItemToSegment(currentPlaylistId, itemId, segment.segment.id);
      selectDeckItem(itemId);
    }
  }));

  return [
    { id: 'rename-deck-item', label: 'Rename', onSelect: () => beginRenameDeckItem(itemId) },
    moveUpItem,
    moveDownItem,
    {
      id: 'move-deck-item',
      label: 'Move',
      disabled: !currentPlaylistId,
      children: [
        ...moveOptions,
        {
          id: 'move-none',
          label: 'Not in selected playlist',
          onSelect: () => {
            if (!currentPlaylistId) return;
            void moveDeckItemToSegment(currentPlaylistId, itemId, null);
            selectDeckItem(itemId);
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
        void moveDeckItemToSegment(currentPlaylistId, itemId, null);
        selectDeckItem(itemId);
      }
    },
    deleteItem
  ];
}

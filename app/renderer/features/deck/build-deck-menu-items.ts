import type { Id, PlaylistTree } from '@core/types';
import type { ContextMenuItem } from '../../components/overlays/context-menu';

interface BuildPresentationMenuItemsOptions {
  entryId?: Id;
  itemId: Id;
  scope: 'library' | 'segment';
  selectedTree: PlaylistTree | null;
  itemIds: Id[];
  selectPlaylistEntry?: (entryId: Id) => void;
  moveDeckItem: (id: Id, direction: 'up' | 'down') => Promise<void>;
  movePlaylistEntryToSegment: (entryId: Id, segmentId: Id | null) => Promise<void>;
  beginRenameDeckItem: (id: Id) => void;
  deleteDeckItem: (id: Id) => Promise<void>;
}

export function buildDeckItemMenuItems({
  entryId,
  itemId,
  scope,
  selectedTree,
  itemIds,
  selectPlaylistEntry,
  moveDeckItem,
  movePlaylistEntryToSegment,
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
    segment.entries.some((entry) => entry.entry.id === entryId)
  )?.segment.id ?? null;
  const moveOptions = (selectedTree?.segments ?? []).map((segment) => ({
    id: `move-${segment.segment.id}`,
    label: segment.segment.name,
    onSelect: () => {
      if (!entryId) return;
      void movePlaylistEntryToSegment(entryId, segment.segment.id);
      selectPlaylistEntry?.(entryId);
    }
  }));

  return [
    { id: 'rename-deck-item', label: 'Rename', onSelect: () => beginRenameDeckItem(itemId) },
    moveUpItem,
    moveDownItem,
    {
      id: 'move-deck-item',
      label: 'Move',
      disabled: !entryId,
      children: [
        ...moveOptions,
        {
          id: 'move-none',
          label: 'Not in selected playlist',
          onSelect: () => {
            if (!entryId) return;
            void movePlaylistEntryToSegment(entryId, null);
          }
        }
      ]
    },
    {
      id: 'remove-from-segment',
      label: 'Remove',
      disabled: !entryId || !assignedSegmentId,
      onSelect: () => {
        if (!entryId) return;
        void movePlaylistEntryToSegment(entryId, null);
      }
    },
    deleteItem
  ];
}

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
  movePlaylistEntry?: (entryId: Id, direction: 'up' | 'down') => Promise<void>;
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
  movePlaylistEntry,
  movePlaylistEntryToSegment,
  beginRenameDeckItem,
  deleteDeckItem
}: BuildPresentationMenuItemsOptions): ContextMenuItem[] {
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
    const itemIndex = itemIds.indexOf(itemId);
    return [
      { id: 'rename-deck-item', label: 'Rename', onSelect: () => beginRenameDeckItem(itemId) },
      {
        id: 'deck-item-up',
        label: 'Move Up',
        disabled: itemIndex <= 0,
        onSelect: () => { void moveDeckItem(itemId, 'up'); }
      },
      {
        id: 'deck-item-down',
        label: 'Move Down',
        disabled: itemIndex < 0 || itemIndex >= itemIds.length - 1,
        onSelect: () => { void moveDeckItem(itemId, 'down'); }
      },
      deleteItem
    ];
  }

  const assignedSegment = selectedTree?.segments.find((segment) =>
    segment.entries.some((entry) => entry.entry.id === entryId)
  ) ?? null;
  const entryIndex = assignedSegment?.entries.findIndex((entry) => entry.entry.id === entryId) ?? -1;
  const totalEntries = assignedSegment?.entries.length ?? 0;
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
    {
      id: 'deck-item-up',
      label: 'Move Up',
      disabled: !entryId || !movePlaylistEntry || entryIndex <= 0,
      onSelect: () => {
        if (!entryId || !movePlaylistEntry) return;
        void movePlaylistEntry(entryId, 'up');
      }
    },
    {
      id: 'deck-item-down',
      label: 'Move Down',
      disabled: !entryId || !movePlaylistEntry || entryIndex < 0 || entryIndex >= totalEntries - 1,
      onSelect: () => {
        if (!entryId || !movePlaylistEntry) return;
        void movePlaylistEntry(entryId, 'down');
      }
    },
    {
      id: 'move-deck-item',
      label: 'Move to segment',
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
      disabled: !entryId || !assignedSegment,
      onSelect: () => {
        if (!entryId) return;
        void movePlaylistEntryToSegment(entryId, null);
      }
    },
    deleteItem
  ];
}

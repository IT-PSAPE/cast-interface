import type { Id, PlaylistTree } from '@core/types';
import type { ContextMenuItem } from '../../../components/context-menu';

interface BuildPresentationMenuItemsOptions {
  presentationId: Id;
  scope: 'library' | 'segment';
  currentPlaylistId: Id | null;
  selectedTree: PlaylistTree | null;
  presentationIds: Id[];
  selectPresentation: (id: Id) => void;
  movePresentation: (id: Id, direction: 'up' | 'down') => Promise<void>;
  movePresentationToSegment: (playlistId: Id, presentationId: Id, segmentId: Id | null) => Promise<void>;
  beginRenamePresentation: (id: Id) => void;
  deletePresentation: (id: Id) => Promise<void>;
}

export function buildPresentationMenuItems({
  presentationId,
  scope,
  currentPlaylistId,
  selectedTree,
  presentationIds,
  selectPresentation,
  movePresentation,
  movePresentationToSegment,
  beginRenamePresentation,
  deletePresentation
}: BuildPresentationMenuItemsOptions): ContextMenuItem[] {
  const presentationIndex = presentationIds.indexOf(presentationId);
  const moveUpItem: ContextMenuItem = {
    id: 'presentation-up',
    label: 'Move Up',
    disabled: presentationIndex <= 0,
    onSelect: () => { void movePresentation(presentationId, 'up'); }
  };
  const moveDownItem: ContextMenuItem = {
    id: 'presentation-down',
    label: 'Move Down',
    disabled: presentationIndex < 0 || presentationIndex >= presentationIds.length - 1,
    onSelect: () => { void movePresentation(presentationId, 'down'); }
  };
  const deleteItem: ContextMenuItem = {
    id: 'delete-presentation',
    label: 'Delete',
    danger: true,
    onSelect: () => {
      if (!window.confirm('Delete this presentation?')) return;
      void deletePresentation(presentationId);
    }
  };

  if (scope === 'library') {
    return [
      { id: 'rename-presentation', label: 'Rename', onSelect: () => beginRenamePresentation(presentationId) },
      moveUpItem,
      moveDownItem,
      deleteItem
    ];
  }

  const assignedSegmentId = selectedTree?.segments.find((segment) =>
    segment.entries.some((entry) => entry.presentation.id === presentationId)
  )?.segment.id ?? null;
  const moveOptions = (selectedTree?.segments ?? []).map((segment) => ({
    id: `move-${segment.segment.id}`,
    label: segment.segment.name,
    onSelect: () => {
      if (!currentPlaylistId) return;
      void movePresentationToSegment(currentPlaylistId, presentationId, segment.segment.id);
      selectPresentation(presentationId);
    }
  }));

  return [
    { id: 'rename-presentation', label: 'Rename', onSelect: () => beginRenamePresentation(presentationId) },
    moveUpItem,
    moveDownItem,
    {
      id: 'move-presentation',
      label: 'Move',
      disabled: !currentPlaylistId,
      children: [
        ...moveOptions,
        {
          id: 'move-none',
          label: 'Not in selected playlist',
          onSelect: () => {
            if (!currentPlaylistId) return;
            void movePresentationToSegment(currentPlaylistId, presentationId, null);
            selectPresentation(presentationId);
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
        void movePresentationToSegment(currentPlaylistId, presentationId, null);
        selectPresentation(presentationId);
      }
    },
    deleteItem
  ];
}

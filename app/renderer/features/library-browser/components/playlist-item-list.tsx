import { useEffect, useState } from 'react';
import type { Id, PlaylistTree } from '@core/types';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { PlaylistSegmentGroup } from './playlist-segment-group';

interface PlaylistItemListProps {
  tree: PlaylistTree | null;
  editingSegmentId: string | null;
  editingPresentationId: string | null;
  onSegmentContextMenu: (event: React.MouseEvent<HTMLElement>, segmentId: string) => void;
  onSegmentMenuButtonClick: (segmentId: string, button: HTMLElement) => void;
  onSegmentPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, presentationId: string) => void;
  onSegmentPresentationMenuButtonClick: (presentationId: string, button: HTMLElement) => void;
  onRenameSegment: (segmentId: string, name: string) => void;
  onRenamePresentation: (presentationId: string, title: string) => void;
  onClearEditingSegment: () => void;
  onClearEditingPresentation: () => void;
}

export function PlaylistItemList({ tree, editingSegmentId, editingPresentationId, onSegmentContextMenu, onSegmentMenuButtonClick, onSegmentPresentationContextMenu, onSegmentPresentationMenuButtonClick, onRenameSegment, onRenamePresentation, onClearEditingSegment, onClearEditingPresentation }: PlaylistItemListProps) {
  const { currentPlaylistPresentationId, createSegment } = useNavigation();
  const { selectPlaylistPresentation } = useSlides();
  const [collapsedSegmentIds, setCollapsedSegmentIds] = useState<Id[]>([]);

  function handleNewSegment() { void createSegment(); }

  useEffect(() => {
    if (!tree) {
      setCollapsedSegmentIds([]);
      return;
    }

    const nextSegmentIds = new Set(tree.segments.map((segment) => segment.segment.id));
    setCollapsedSegmentIds((current) => current.filter((segmentId) => nextSegmentIds.has(segmentId)));
  }, [tree]);

  function handleToggleSegment(segmentId: Id) {
    setCollapsedSegmentIds((current) => {
      if (current.includes(segmentId)) {
        return current.filter((id) => id !== segmentId);
      }

      return [...current, segmentId];
    });
  }

  function isSegmentCollapsed(segmentId: Id): boolean {
    return collapsedSegmentIds.includes(segmentId);
  }

  if (!tree) {
    return <div className="grid h-full min-h-0 place-items-center p-4 text-[12px] text-text-tertiary">Select a playlist</div>;
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-primary bg-primary px-2.5 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Segments</span>
        <IconButton label="New segment" onClick={handleNewSegment}>
          <Icon.folder_plus size={14} strokeWidth={1.75} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
        {tree.segments.map((segment) => (
          <PlaylistSegmentGroup
            key={segment.segment.id}
            segment={segment}
            collapsed={isSegmentCollapsed(segment.segment.id)}
            selectedPresentationId={currentPlaylistPresentationId}
            editingSegmentId={editingSegmentId}
            editingPresentationId={editingPresentationId}
            onSelectPresentation={selectPlaylistPresentation}
            onToggleCollapsed={handleToggleSegment}
            onSegmentContextMenu={onSegmentContextMenu}
            onSegmentMenuButtonClick={onSegmentMenuButtonClick}
            onPresentationContextMenu={onSegmentPresentationContextMenu}
            onPresentationMenuButtonClick={onSegmentPresentationMenuButtonClick}
            onRenameSegment={onRenameSegment}
            onRenamePresentation={onRenamePresentation}
            onClearEditingSegment={onClearEditingSegment}
            onClearEditingPresentation={onClearEditingPresentation}
          />
        ))}
      </div>
    </section>
  );
}

import type { PlaylistTree } from '@core/types';
import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';
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
  const { currentPlaylistPresentationId, openPresentation, createSegment } = useNavigation();

  function handleNewSegment() { void createSegment(); }

  if (!tree) {
    return <div className="grid h-full min-h-0 place-items-center p-4 text-[12px] text-text-tertiary">Select a playlist</div>;
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-primary bg-background-primary_alt px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Segments</span>
        <IconButton label="New segment" onClick={handleNewSegment} className="h-5 w-5">
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" aria-hidden="true">
            <path d="M2.5 4.5H7.5L9 6H13.5V12.5H2.5V4.5Z" strokeWidth="1.25" />
            <path d="M8 7.5V11.5" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M6 9.5H10" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1">
        {tree.segments.map((segment) => (
          <PlaylistSegmentGroup
            key={segment.segment.id}
            segment={segment}
            selectedPresentationId={currentPlaylistPresentationId}
            editingSegmentId={editingSegmentId}
            editingPresentationId={editingPresentationId}
            onSelectPresentation={openPresentation}
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

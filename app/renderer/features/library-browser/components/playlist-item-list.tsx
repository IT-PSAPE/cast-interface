import type { PlaylistTree } from '@core/types';
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

  function handleNewSegment() { void createSegment(); }

  if (!tree) {
    return <div className="grid h-full min-h-0 place-items-center p-4 text-[12px] text-text-tertiary">Select a playlist</div>;
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-primary bg-primary px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Segments</span>
        <IconButton label="New segment" onClick={handleNewSegment}>
          <Icon.folder_plus size={14} strokeWidth={1.75} />
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
            onSelectPresentation={selectPlaylistPresentation}
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

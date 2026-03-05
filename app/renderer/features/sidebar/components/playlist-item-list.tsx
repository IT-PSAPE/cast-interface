import type { PlaylistTree } from '@core/types';
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

const ICON_BUTTON_CLASS =
  'grid h-5 w-5 place-items-center rounded border border-stroke bg-surface-2 text-text-secondary cursor-pointer transition-colors hover:text-text-primary hover:border-focus';

export function PlaylistItemList({ tree, editingSegmentId, editingPresentationId, onSegmentContextMenu, onSegmentMenuButtonClick, onSegmentPresentationContextMenu, onSegmentPresentationMenuButtonClick, onRenameSegment, onRenamePresentation, onClearEditingSegment, onClearEditingPresentation }: PlaylistItemListProps) {
  const { currentPresentationId, openPresentation, createSegment } = useNavigation();

  function handleNewSegment() { void createSegment(); }

  if (!tree) {
    return <div className="grid place-items-center p-4 text-[12px] text-text-muted">Select a playlist</div>;
  }

  return (
    <section className="min-h-0 overflow-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface-1 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Segments</span>
        <button onClick={handleNewSegment} className={ICON_BUTTON_CLASS} aria-label="New segment" title="Create segment">
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" aria-hidden="true">
            <path d="M2.5 4.5H7.5L9 6H13.5V12.5H2.5V4.5Z" strokeWidth="1.25" />
            <path d="M8 7.5V11.5" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M6 9.5H10" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-1 pb-1">
        {tree.segments.map((segment) => (
          <PlaylistSegmentGroup
            key={segment.segment.id}
            segment={segment}
            selectedPresentationId={currentPresentationId}
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

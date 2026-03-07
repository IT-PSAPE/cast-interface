import type { PlaylistTree } from '@core/types';
import { Button } from '../../../components/button';
import { EditableText } from '../../../components/editable-text';
import { IconButton } from '../../../components/icon-button';
import { getSegmentHeaderColors } from '../utils/segment-header-color';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
  selectedPresentationId: string | null;
  editingSegmentId: string | null;
  editingPresentationId: string | null;
  onSelectPresentation: (id: string) => void;
  onSegmentContextMenu: (event: React.MouseEvent<HTMLElement>, segmentId: string) => void;
  onSegmentMenuButtonClick: (segmentId: string, button: HTMLElement) => void;
  onPresentationContextMenu: (event: React.MouseEvent<HTMLElement>, presentationId: string) => void;
  onPresentationMenuButtonClick: (presentationId: string, button: HTMLElement) => void;
  onRenameSegment: (segmentId: string, name: string) => void;
  onRenamePresentation: (presentationId: string, title: string) => void;
  onClearEditingSegment: () => void;
  onClearEditingPresentation: () => void;
}

export function PlaylistSegmentGroup({ segment, selectedPresentationId, editingSegmentId, editingPresentationId, onSelectPresentation, onSegmentContextMenu, onSegmentMenuButtonClick, onPresentationContextMenu, onPresentationMenuButtonClick, onRenameSegment, onRenamePresentation, onClearEditingSegment, onClearEditingPresentation }: PlaylistSegmentGroupProps) {
  const isSegmentEditing = segment.segment.id === editingSegmentId;
  const segmentHeaderColors = getSegmentHeaderColors(segment.segment.id, segment.segment.colorKey);
  function handleSegmentContextMenu(event: React.MouseEvent<HTMLElement>) { onSegmentContextMenu(event, segment.segment.id); }
  function handleSegmentMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onSegmentMenuButtonClick(segment.segment.id, event.currentTarget);
  }

  function handleSegmentRename(name: string) {
    onRenameSegment(segment.segment.id, name);
    onClearEditingSegment();
  }

  return (
    <div className="group/segment mb-1">
      <div
        className="group/segment-header flex items-center justify-between rounded-sm px-2 py-1"
        style={{ backgroundColor: segmentHeaderColors.backgroundColor, color: segmentHeaderColors.textColor }}
        onContextMenu={handleSegmentContextMenu}
      >
        <EditableText value={segment.segment.name} onCommit={handleSegmentRename} editing={isSegmentEditing} className="text-[11px] font-semibold uppercase tracking-wider text-current" />
        <IconButton
          label={`Open ${segment.segment.name} menu`}
          onClick={handleSegmentMenuButtonClick}
          className="h-5 w-5 border-transparent bg-transparent text-current opacity-0 transition-opacity group-hover/segment-header:opacity-100 group-focus-within/segment-header:opacity-100 hover:border-stroke"
        >
          ⋮
        </IconButton>
      </div>

      {segment.entries.map((entry) => {
        const isSelected = entry.presentation.id === selectedPresentationId;
        const isPresentationEditing = entry.presentation.id === editingPresentationId;

        function handleSelect() { onSelectPresentation(entry.presentation.id); }
        function handleContextMenu(event: React.MouseEvent<HTMLElement>) { onPresentationContextMenu(event, entry.presentation.id); }
        function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
          event.stopPropagation();
          onPresentationMenuButtonClick(entry.presentation.id, event.currentTarget);
        }

        function handleRename(title: string) {
          onRenamePresentation(entry.presentation.id, title);
          onClearEditingPresentation();
        }

        return (
          <div key={entry.entry.id} className="group relative">
            <Button
              variant="ghost"
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              className={`flex w-full items-center gap-2 rounded-sm border-0 py-1 pl-4 pr-8 text-left text-[13px] transition-colors ${
                isSelected
                  ? 'cursor-pointer bg-selected/15 text-text-primary'
                  : 'cursor-pointer bg-transparent text-text-secondary hover:bg-surface-3/50 hover:text-text-primary'
              }`}
            >
              <EditableText value={entry.presentation.title} onCommit={handleRename} editing={isPresentationEditing} className="flex-1 text-[13px]" />
            </Button>

            <IconButton
              label={`Open ${entry.presentation.title} menu`}
              onClick={handleMenuButtonClick}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded border border-transparent text-text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-stroke hover:text-text-primary"
            >
              ⋮
            </IconButton>
          </div>
        );
      })}
    </div>
  );
}

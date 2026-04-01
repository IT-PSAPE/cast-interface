import type { PlaylistTree } from '@core/types';
import { Icon } from '../../../components/icon';
import { Button } from '../../../components/button';
import { EditableText } from '../../../components/editable-text';
import { IconButton } from '../../../components/icon-button';
import { ContentItemIcon } from '../../../components/presentation-entity-icon';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { useLibraryBrowser } from '../contexts/library-browser-context';
import { useLibraryPanelState } from '../contexts/library-panel-context';
import { getSegmentHeaderColors } from '../utils/segment-header-color';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
}

export function PlaylistSegmentGroup({ segment }: PlaylistSegmentGroupProps) {
  const { currentPlaylistContentItemId } = useNavigation();
  const { selectPlaylistContentItem } = useSlides();
  const { state, actions } = useLibraryBrowser();
  const { isSegmentCollapsed, toggleSegmentCollapsed } = useLibraryPanelState();
  const collapsed = isSegmentCollapsed(segment.segment.id);
  const isSegmentEditing = segment.segment.id === state.editingSegmentId;
  const segmentHeaderColors = getSegmentHeaderColors(segment.segment.id, segment.segment.colorKey);

  function handleSegmentContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handleSegmentContextMenu(event, segment.segment.id); }

  function handleCollapseToggle() {
    toggleSegmentCollapsed(segment.segment.id);
  }

  function handleSegmentMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    actions.openSegmentMenuFromButton(segment.segment.id, event.currentTarget);
  }

  function handleSegmentRename(name: string) {
    actions.renameSegment(segment.segment.id, name);
    actions.clearEditingSegment();
  }

  return (
    <div className="group/segment grid gap-1">
      <div
        className="group/segment-header flex items-center justify-between gap-2 rounded-sm px-1.5 py-1"
        style={{
          backgroundColor: segmentHeaderColors.backgroundColor,
          color: segmentHeaderColors.textColor
        }}
        onContextMenu={handleSegmentContextMenu}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <IconButton
            label={collapsed ? `Expand ${segment.segment.name}` : `Collapse ${segment.segment.name}`}
            onClick={handleCollapseToggle}
            aria-expanded={!collapsed}
            size="sm"
            variant="ghost"
            className="shrink-0 border-transparent text-current hover:border-border-primary"
          >
            {collapsed ? <Icon.chevron_right size={14} strokeWidth={2} /> : <Icon.chevron_down size={14} strokeWidth={2} />}
          </IconButton>
          <EditableText value={segment.segment.name} onCommit={handleSegmentRename} editing={isSegmentEditing} className="min-w-0 text-sm font-semibold uppercase tracking-wider text-current" />
        </div>

        <IconButton
          label={`Open ${segment.segment.name} menu`}
          onClick={handleSegmentMenuButtonClick}
          size="sm"
          variant="ghost"
          className="border-transparent text-current opacity-0 transition-opacity group-hover/segment-header:opacity-100 group-focus-within/segment-header:opacity-100 hover:border-border-primary"
        >
          <Icon.dots_vertical size={14} strokeWidth={2} />
        </IconButton>
      </div>

      {!collapsed ? segment.entries.map((entry) => {
        const isSelected = entry.item.id === currentPlaylistContentItemId;
        const isPresentationEditing = entry.item.id === state.editingPresentationId;

        function handleSelect() { selectPlaylistContentItem(entry.item.id); }
        function handleContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handleSegmentPresentationContextMenu(event, entry.item.id); }
        function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
          event.stopPropagation();
          actions.openSegmentPresentationMenuFromButton(entry.item.id, event.currentTarget);
        }

        function handleRename(title: string) {
          actions.renameContentItem(entry.item.id, title);
          actions.clearEditingPresentation();
        }

        return (
          <div key={entry.entry.id} className="group relative">
            <Button
              variant="ghost"
              active={isSelected}
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              className="flex w-full items-center gap-2 rounded-sm border-0 px-2 py-1 pl-7 pr-8 text-left text-md cursor-pointer hover:bg-background-quaternary/50 hover:text-text-primary"
            >
              <ContentItemIcon entity={entry.item} className="shrink-0 text-text-tertiary" />
              <EditableText value={entry.item.title} onCommit={handleRename} editing={isPresentationEditing} className="flex-1 text-md" />
            </Button>

            <IconButton
              label={`Open ${entry.item.title} menu`}
              onClick={handleMenuButtonClick}
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded border border-transparent text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-border-primary hover:text-text-primary"
            >
              <Icon.dots_vertical size={14} strokeWidth={2} />
            </IconButton>
          </div>
        );
      }) : null}
    </div>
  );
}

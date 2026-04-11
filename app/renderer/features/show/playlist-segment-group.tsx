import type { PlaylistTree } from '@core/types';
import { ChevronDown, ChevronRight, EllipsisVertical } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { EditableText } from '../../components/form/editable-text';

import { ContentItemIcon } from '../../components/display/presentation-entity-icon';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlides } from '../../contexts/slide-context';
import { useLibraryBrowser } from './library-browser-context';
import { useLibraryPanelState } from './library-panel-context';
import { getSegmentHeaderColors } from './segment-header-color';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
}

export function PlaylistSegmentGroup({ segment }: PlaylistSegmentGroupProps) {
  const { currentPlaylistContentItemId } = useNavigation();
  const { selectPlaylistContentItem } = useSlides();
  const { state, actions } = useLibraryBrowser();
  const { isSegmentCollapsed, toggleSegmentCollapsed } = useLibraryPanelState();
  const collapsed = isSegmentCollapsed(segment.segment.id);
  const isSegmentEditing = actions.isEditing('segment', segment.segment.id);
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
    actions.clearEditing();
  }

  return (
    <div className="group/segment grid gap-0.5">
      <div
        className="group/segment-header flex items-center justify-between gap-2 rounded-sm px-1.5 py-1"
        style={{
          backgroundColor: segmentHeaderColors.backgroundColor,
          color: segmentHeaderColors.textColor
        }}
        onContextMenu={handleSegmentContextMenu}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Button.Icon
            label={collapsed ? `Expand ${segment.segment.name}` : `Collapse ${segment.segment.name}`}
            onClick={handleCollapseToggle}
            aria-expanded={!collapsed}
            variant="ghost"
            className="shrink-0 border-transparent text-current hover:border-primary"
          >
            {collapsed ? <ChevronRight /> : <ChevronDown />}
          </Button.Icon>
          <EditableText value={segment.segment.name} onCommit={handleSegmentRename} editing={isSegmentEditing} className="min-w-0 text-sm font-semibold uppercase tracking-wider text-current" />
        </div>

        <Button.Icon
          label={`Open ${segment.segment.name} menu`}
          onClick={handleSegmentMenuButtonClick}
          variant="ghost"
          className="border-transparent text-current opacity-0 transition-opacity group-hover/segment-header:opacity-100 group-focus-within/segment-header:opacity-100 hover:border-primary"
        >
          <EllipsisVertical />
        </Button.Icon>
      </div>

      {!collapsed ? segment.entries.map((entry) => {
        const isSelected = entry.item.id === currentPlaylistContentItemId;
        const isPresentationEditing = actions.isEditing('presentation', entry.item.id);

        function handleSelect() { selectPlaylistContentItem(entry.item.id); }
        function handleContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handleSegmentPresentationContextMenu(event, entry.item.id); }
        function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
          event.stopPropagation();
          actions.openSegmentPresentationMenuFromButton(entry.item.id, event.currentTarget);
        }

        function handleRename(title: string) {
          actions.renameContentItem(entry.item.id, title);
          actions.clearEditing();
        }

        return (
          <div key={entry.entry.id} className="group relative">
            <Button
              variant="ghost"
              active={isSelected}
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              className="flex w-full items-center gap-2 rounded-sm border-0 px-2 py-1 pl-7 pr-8 text-left text-md cursor-pointer hover:bg-quaternary/50 hover:text-primary"
            >
              <ContentItemIcon entity={entry.item} className="shrink-0 text-tertiary" />
              <EditableText value={entry.item.title} onCommit={handleRename} editing={isPresentationEditing} className="flex-1 text-md" />
            </Button>

            <Button.Icon
              label={`Open ${entry.item.title} menu`}
              onClick={handleMenuButtonClick}
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded border border-transparent text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-primary hover:text-primary"
            >
              <EllipsisVertical size={14} strokeWidth={2} />
            </Button.Icon>
          </div>
        );
      }) : null}
    </div>
  );
}

import type { PlaylistTree } from '@core/types';
import { ChevronDown, EllipsisVertical } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { EditableField } from '../../components/form/editable-field';
import { Accordion } from '../../components/display/accordion';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlides } from '../../contexts/slide-context';
import { useLibraryBrowser } from './library-browser-context';
import { getSegmentHeaderColors } from './segment-header-color';
import { Panel } from '@renderer/components/layout/panel';
import { useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';
import { Paragraph } from '@renderer/components/display/text';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
}

export function PlaylistSegmentGroup({ segment }: PlaylistSegmentGroupProps) {
  const { currentPlaylistEntryId } = useNavigation();
  const { selectPlaylistEntry } = useSlides();
  const { actions } = useLibraryBrowser();
  const isSegmentEditing = actions.isEditing('segment', segment.segment.id);
  const segmentHeaderColors = getSegmentHeaderColors(segment.segment.id, segment.segment.colorKey);

  function handleSegmentContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handleSegmentContextMenu(event, segment.segment.id); }

  function handleSegmentMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    actions.openSegmentMenuFromButton(segment.segment.id, event.currentTarget);
  }

  function handleSegmentRename(name: string) {
    actions.renameSegment(segment.segment.id, name);
    actions.clearEditing();
  }

  return (
    <Accordion.Item value={segment.segment.id} className="group/segment">
      <div
        className="group/segment-header flex items-center justify-between gap-2 px-1.5 py-0.5"
        style={{
          backgroundColor: segmentHeaderColors.backgroundColor,
          color: segmentHeaderColors.textColor
        }}
        onContextMenu={handleSegmentContextMenu}
      >
        <Accordion.Trigger className="group/collapse cursor-pointer items-start !text-xs text-left">
          <EditableField value={segment.segment.name} onCommit={handleSegmentRename} editing={isSegmentEditing} />
        </Accordion.Trigger>
        <Button.Icon
          label={`Open ${segment.segment.name} menu`}
          onClick={handleSegmentMenuButtonClick}
          variant="ghost"
          className="opacity-0 group-hover/segment-header:opacity-100 group-focus-within/segment-header:opacity-100"
        >
          <EllipsisVertical />
        </Button.Icon>
      </div>
      <Accordion.Content>
        {segment.entries.map((entry) => {
          const isSelected = entry.entry.id === currentPlaylistEntryId;

          function handleSelect() { selectPlaylistEntry(entry.entry.id); }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handleSegmentPresentationContextMenu(event, entry.entry.id, entry.item.id); }
          function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
            event.stopPropagation();
            actions.openSegmentPresentationMenuFromButton(entry.entry.id, entry.item.id, event.currentTarget);
          }

          return (
            <SegmentEntryRow
              key={entry.entry.id}
              item={entry.item}
              isSelected={isSelected}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
              onMenuClick={handleMenuButtonClick}
            />
          );
        })}
      </Accordion.Content>
    </Accordion.Item>
  );
}

interface SegmentEntryRowProps {
  item: PlaylistTree['segments'][number]['entries'][number]['item'];
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function SegmentEntryRow({ item, isSelected, onSelect, onContextMenu, onMenuClick }: SegmentEntryRowProps) {
  const ref = useScrollAreaActiveItem(isSelected);

  return (
    <Panel.Item ref={ref} className='!rounded-none' selected={isSelected} onContextMenu={onContextMenu}>
      <Panel.ItemButton onClick={onSelect}>
        <DeckItemIcon entity={item} className="shrink-0 text-tertiary" />
        <Paragraph.xs className="line-clamp-1">{item.title}</Paragraph.xs>
      </Panel.ItemButton>
      <Panel.ItemActions>
        <Button.Icon label={`Open ${item.title} menu`} onClick={onMenuClick}>
          <EllipsisVertical size={14} strokeWidth={2} />
        </Button.Icon>
      </Panel.ItemActions>
    </Panel.Item>
  );
}

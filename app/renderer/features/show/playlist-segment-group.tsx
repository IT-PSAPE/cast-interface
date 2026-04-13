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
import { Paragraph } from '@renderer/components/display/text';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
}

export function PlaylistSegmentGroup({ segment }: PlaylistSegmentGroupProps) {
  const { currentPlaylistDeckItemId } = useNavigation();
  const { selectPlaylistDeckItem } = useSlides();
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
          const isSelected = entry.item.id === currentPlaylistDeckItemId;
          const isPresentationEditing = actions.isEditing('presentation', entry.item.id);

          function handleSelect() { selectPlaylistDeckItem(entry.item.id); }
          function handleContextMenu(event: React.MouseEvent<HTMLElement>) { actions.handleSegmentPresentationContextMenu(event, entry.item.id); }
          function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
            event.stopPropagation();
            actions.openSegmentPresentationMenuFromButton(entry.item.id, event.currentTarget);
          }

          function handleRename(title: string) {
            actions.renameDeckItem(entry.item.id, title);
            actions.clearEditing();
          }

          return (
            <Panel.Item className='!rounded-none'>
              <Panel.ItemButton onClick={handleSelect}>
                <DeckItemIcon entity={entry.item} className="shrink-0 text-tertiary" />
                <Paragraph.xs>{entry.item.title}</Paragraph.xs>
              </Panel.ItemButton>
              <Panel.ItemActions>
                <Button.Icon label={`Open ${entry.item.title} menu`} onClick={handleMenuButtonClick}>
                  <EllipsisVertical size={14} strokeWidth={2} />
                </Button.Icon>
              </Panel.ItemActions>
            </Panel.Item>
          )

          // return (
          //   <div key={entry.entry.id} className="group relative">
          //     <Button
          //       variant="ghost"
          //       active={isSelected}
          //       onClick={handleSelect}
          //       onContextMenu={handleContextMenu}
          //       className="flex w-full items-center gap-2 rounded-sm border-0 px-2 py-1 pl-7 pr-8 text-left text-md cursor-pointer hover:bg-quaternary/50 hover:text-primary"
          //     >
          //       <DeckItemIcon entity={entry.item} className="shrink-0 text-tertiary" />
          //       <EditableField value={entry.item.title} onCommit={handleRename} editing={isPresentationEditing} className="flex-1 text-md" />
          //     </Button>



          //     <Button.Icon
          //       label={`Open ${entry.item.title} menu`}
          //       onClick={handleMenuButtonClick}
          //       variant="ghost"
          //       className="absolute right-1 top-1/2 -translate-y-1/2 rounded border border-transparent text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:border-primary hover:text-primary"
          //     >
          //       <EllipsisVertical size={14} strokeWidth={2} />
          //     </Button.Icon>
          //   </div>
          // );
        })}
      </Accordion.Content>
    </Accordion.Item>
  );
}

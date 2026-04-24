import type { PlaylistTree } from '@core/types';
import { EllipsisVertical } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

export const SEGMENT_CONTAINER_PREFIX = 'segment-container:';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
  isEntryDragActive: boolean;
}

export function PlaylistSegmentGroup({ segment, isEntryDragActive }: PlaylistSegmentGroupProps) {
  const { currentPlaylistEntryId } = useNavigation();
  const { selectPlaylistEntry } = useSlides();
  const { actions } = useLibraryBrowser();
  const isSegmentEditing = actions.isEditing('segment', segment.segment.id);
  const segmentHeaderColors = getSegmentHeaderColors(segment.segment.id, segment.segment.colorKey);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: segment.segment.id });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: `${SEGMENT_CONTAINER_PREFIX}${segment.segment.id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

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
    <Accordion.Item ref={setNodeRef} style={style} value={segment.segment.id} className="group/segment">
      <div
        className="group/segment-header flex items-center justify-between gap-2 px-1.5 py-0.5"
        style={{
          backgroundColor: segmentHeaderColors.backgroundColor,
          color: segmentHeaderColors.textColor
        }}
        onContextMenu={handleSegmentContextMenu}
        {...attributes}
        {...listeners}
      >
        <Accordion.Trigger className="group/collapse cursor-pointer items-start !text-xs text-left">
          <EditableField value={segment.segment.name} onCommit={handleSegmentRename} editing={isSegmentEditing} />
        </Accordion.Trigger>
        <Button.Icon
          label={`Open ${segment.segment.name} menu`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={handleSegmentMenuButtonClick}
          variant="ghost"
          className="opacity-0 group-hover/segment-header:opacity-100 group-focus-within/segment-header:opacity-100"
        >
          <EllipsisVertical />
        </Button.Icon>
      </div>
      <Accordion.Content>
        <SortableContext items={segment.entries.map((entry) => entry.entry.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setDroppableRef}
            className={segment.entries.length === 0 && isEntryDragActive
              ? `min-h-8 rounded-sm transition-colors ${isOver ? 'bg-brand_solid/15 outline outline-1 outline-brand_solid/40' : ''}`
              : ''}
          >
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
                  entryId={entry.entry.id}
                  item={entry.item}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                  onContextMenu={handleContextMenu}
                  onMenuClick={handleMenuButtonClick}
                />
              );
            })}
          </div>
        </SortableContext>
      </Accordion.Content>
    </Accordion.Item>
  );
}

interface SegmentEntryRowProps {
  entryId: string;
  item: PlaylistTree['segments'][number]['entries'][number]['item'];
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function SegmentEntryRow({ entryId, item, isSelected, onSelect, onContextMenu, onMenuClick }: SegmentEntryRowProps) {
  const activeRef = useScrollAreaActiveItem(isSelected);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entryId });
  const setRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    activeRef.current = el;
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  };

  return (
    <Panel.Item ref={setRef} style={style} className='!rounded-none' selected={isSelected} onContextMenu={onContextMenu} {...attributes} {...listeners}>
      <Panel.ItemButton onClick={onSelect}>
        <DeckItemIcon entity={item} className="shrink-0 text-tertiary" />
        <Paragraph.xs className="line-clamp-1">{item.title}</Paragraph.xs>
      </Panel.ItemButton>
      <Panel.ItemActions>
        <Button.Icon label={`Open ${item.title} menu`} onPointerDown={(event) => event.stopPropagation()} onClick={onMenuClick}>
          <EllipsisVertical size={14} strokeWidth={2} />
        </Button.Icon>
      </Panel.ItemActions>
    </Panel.Item>
  );
}

export function SegmentEntryDragOverlay({ item }: { item: PlaylistTree['segments'][number]['entries'][number]['item'] }) {
  return (
    <Panel.Item className="!rounded-sm border border-primary bg-tertiary shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <Panel.ItemButton>
        <DeckItemIcon entity={item} className="shrink-0 text-tertiary" />
        <Paragraph.xs className="line-clamp-1">{item.title}</Paragraph.xs>
      </Panel.ItemButton>
    </Panel.Item>
  );
}

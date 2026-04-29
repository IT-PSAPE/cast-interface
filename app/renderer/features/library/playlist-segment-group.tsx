import { useEffect, useRef, useState } from 'react';
import type { DeckItem, PlaylistEntry, PlaylistTree } from '@core/types';
import { RenameField, type RenameFieldHandle } from '@renderer/components/form/rename-field';
import { Accordion } from '../../components/display/accordion';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlides } from '../../contexts/slide-context';
import { useLibraryBrowser } from './library-browser-context';
import { getSegmentHeaderColors } from './segment-header-color';
import { RecastPanel } from '@renderer/components/layout/panel';
import { hasDeckItemDragData, readDeckItemDragData } from '../../utils/deck-item-drag';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
}

export function PlaylistSegmentGroup({ segment }: PlaylistSegmentGroupProps) {
  const { addDeckItemToSegmentAt } = useNavigation();
  const { actions } = useLibraryBrowser();
  const isSegmentEditing = actions.isEditing('segment', segment.segment.id);
  const segmentHeaderColors = getSegmentHeaderColors(segment.segment.id, segment.segment.colorKey);
  const renameRef = useRef<RenameFieldHandle>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isSegmentEditing) renameRef.current?.startEditing();
  }, [isSegmentEditing]);

  function handleSegmentRename(name: string) {
    actions.renameSegment(segment.segment.id, name);
    actions.clearEditing();
  }

  function acceptDeckItemDrop(event: React.DragEvent<HTMLElement>, nextDropIndex: number) {
    if (!hasDeckItemDragData(event.dataTransfer)) return false;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDropIndex(nextDropIndex);
    return true;
  }

  function handleHeaderDragOver(event: React.DragEvent<HTMLDivElement>) {
    acceptDeckItemDrop(event, segment.entries.length);
  }

  function handleContentDragOver(event: React.DragEvent<HTMLDivElement>) {
    acceptDeckItemDrop(event, segment.entries.length);
  }

  function handleEntryDragOver(index: number, event: React.DragEvent<HTMLElement>) {
    if (!hasDeckItemDragData(event.dataTransfer)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';

    const bounds = event.currentTarget.getBoundingClientRect();
    const isAfter = event.clientY > bounds.top + (bounds.height / 2);
    setDropIndex(isAfter ? index + 1 : index);
  }

  function handleDragLeave(event: React.DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setDropIndex(null);
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    if (!hasDeckItemDragData(event.dataTransfer)) return;
    event.preventDefault();
    event.stopPropagation();

    const itemId = readDeckItemDragData(event.dataTransfer);
    const nextDropIndex = dropIndex ?? segment.entries.length;
    setDropIndex(null);
    if (!itemId) return;

    void addDeckItemToSegmentAt(segment.segment.id, itemId, nextDropIndex);
  }

  return (
    <Accordion.Item value={segment.segment.id} className="group/segment" onDragLeave={handleDragLeave}>
      <Accordion.Trigger
        className={`h-7 flex items-center justify-between px-2 ${dropIndex !== null ? 'ring-1 ring-brand_solid/60' : ''}`}
        style={{ backgroundColor: segmentHeaderColors.backgroundColor, color: segmentHeaderColors.textColor }}
        onDragOver={handleHeaderDragOver}
        onDrop={handleDrop}
      >
        <RenameField ref={renameRef} value={segment.segment.name} onValueChange={handleSegmentRename} className="label-xs" />
      </Accordion.Trigger>
      <Accordion.Content className='p-1' onDragOver={handleContentDragOver} onDrop={handleDrop}>
        {renderSegmentEntries({
          entries: segment.entries,
          dropIndex,
          onEntryDragOver: handleEntryDragOver,
          onEntryDrop: handleDrop,
        })}
      </Accordion.Content>
    </Accordion.Item>
  );
}

function SegmentEntryRow({
  item,
  entry,
  onDeckItemDragOver,
  onDeckItemDrop,
}: {
  entry: PlaylistEntry;
  item: DeckItem;
  onDeckItemDragOver: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDeckItemDrop: (event: React.DragEvent<HTMLButtonElement>) => void;
}) {
  const { currentPlaylistEntryId, renameDeckItem } = useNavigation();
  const { selectPlaylistEntry } = useSlides();
  const renameRef = useRef<RenameFieldHandle>(null);

  const isSelected = entry.id === currentPlaylistEntryId;

  function handleSelect() { selectPlaylistEntry(entry.id); }

  function handleRename(name: string) {
    void renameDeckItem(item.id, name);
  }

  return (
    <RecastPanel.MenuItem active={isSelected} onClick={handleSelect} onDragOver={onDeckItemDragOver} onDrop={onDeckItemDrop} className='my-0.5'>
      <DeckItemIcon entity={item} className="shrink-0" />
      <RenameField ref={renameRef} value={item.title} onValueChange={handleRename} className="label-xs" />
    </RecastPanel.MenuItem>
  );
}

function renderSegmentEntries({
  entries,
  dropIndex,
  onEntryDragOver,
  onEntryDrop,
}: {
  entries: PlaylistTree['segments'][number]['entries'];
  dropIndex: number | null;
  onEntryDragOver: (index: number, event: React.DragEvent<HTMLButtonElement>) => void;
  onEntryDrop: (event: React.DragEvent<HTMLElement>) => void;
}) {
  const nodes: React.ReactNode[] = [];

  entries.forEach((entry, index) => {
    if (dropIndex === index) {
      nodes.push(<DropIndicator key={`drop-${index}`} />);
    }

    nodes.push(
      <SegmentEntryRow
        key={entry.entry.id}
        entry={entry.entry}
        item={entry.item}
        onDeckItemDragOver={(event) => onEntryDragOver(index, event)}
        onDeckItemDrop={onEntryDrop}
      />,
    );
  });

  if (dropIndex === entries.length) {
    nodes.push(<DropIndicator key="drop-end" />);
  }

  return nodes;
}

function DropIndicator() {
  return (
    <div className="0px w-full overflow-visible relative !m-0">
      <div className="absolute inset-0 h-[2px] w-full bg-brand_solid -translate-y-1/2" />
    </div>
  );
}

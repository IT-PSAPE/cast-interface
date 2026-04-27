import { useEffect, useRef } from 'react';
import type { DeckItem, PlaylistEntry, PlaylistTree } from '@core/types';
import { RenameField, type RenameFieldHandle } from '@renderer/components 2.0/rename-field';
import { Accordion } from '../../components/display/accordion';
import { DeckItemIcon } from '../../components/display/entity-icon';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlides } from '../../contexts/slide-context';
import { useLibraryBrowser } from './library-browser-context';
import { getSegmentHeaderColors } from './segment-header-color';
import { RecastPanel } from '@renderer/components 2.0/panel';

interface PlaylistSegmentGroupProps {
  segment: PlaylistTree['segments'][number];
}

export function PlaylistSegmentGroup({ segment }: PlaylistSegmentGroupProps) {
  const { actions } = useLibraryBrowser();
  const isSegmentEditing = actions.isEditing('segment', segment.segment.id);
  const segmentHeaderColors = getSegmentHeaderColors(segment.segment.id, segment.segment.colorKey);
  const renameRef = useRef<RenameFieldHandle>(null);

  useEffect(() => {
    if (isSegmentEditing) renameRef.current?.startEditing();
  }, [isSegmentEditing]);

  function handleSegmentRename(name: string) {
    actions.renameSegment(segment.segment.id, name);
    actions.clearEditing();
  }

  return (
    <Accordion.Item value={segment.segment.id} className="group/segment">
      <Accordion.Trigger className="h-7 flex items-center justify-between px-2" style={{ backgroundColor: segmentHeaderColors.backgroundColor, color: segmentHeaderColors.textColor }}>
        <RenameField ref={renameRef} value={segment.segment.name} onValueChange={handleSegmentRename} className="label-xs" />
      </Accordion.Trigger>
      <Accordion.Content className='p-1 space-y-1'>
        {segment.entries.map((entry) => <SegmentEntryRow key={entry.entry.id} entry={entry.entry} item={entry.item} />)}
      </Accordion.Content>
    </Accordion.Item>
  );
}

function SegmentEntryRow({ item, entry }: {entry: PlaylistEntry; item: DeckItem}) {
  const { currentPlaylistEntryId, renameDeckItem } = useNavigation();
  const { selectPlaylistEntry } = useSlides();
  const renameRef = useRef<RenameFieldHandle>(null);

  const isSelected = entry.id === currentPlaylistEntryId;

  function handleSelect() { selectPlaylistEntry(entry.id); }

  function handleRename(name: string) {
    void renameDeckItem(item.id, name);
  }

  return (
    <RecastPanel.MenuItem active={isSelected} onClick={handleSelect}>
      <DeckItemIcon entity={item} className="shrink-0 text-tertiary" />
      <RenameField ref={renameRef} value={item.title} onValueChange={handleRename} className="label-xs" />
    </RecastPanel.MenuItem>
  );
}

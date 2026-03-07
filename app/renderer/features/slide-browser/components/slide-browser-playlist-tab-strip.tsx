import { useCallback } from 'react';
import type { Id } from '@core/types';
import { Tab, TabBar } from '../../../components/tab-bar';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import type { PlaylistPresentationSequenceItem } from '../hooks/use-playlist-presentation-sequence';

interface SlideBrowserPlaylistTabStripProps {
  items: PlaylistPresentationSequenceItem[];
}

interface PlaylistTabItemProps {
  item: PlaylistPresentationSequenceItem;
  active: boolean;
  onSelect: (presentationId: Id) => void;
}

function PlaylistTabItem({ item, active, onSelect }: PlaylistTabItemProps) {
  const handleSelect = useCallback(() => {
    onSelect(item.presentation.id);
  }, [item.presentation.id, onSelect]);

  const duplicateSuffix = item.occurrenceIndex > 1 ? ` (${item.occurrenceIndex})` : '';
  const tabLabel = `${item.presentation.title}${duplicateSuffix}`;

  return (
    <Tab active={active} onClick={handleSelect}>
      <span className="max-w-[180px] truncate" title={tabLabel}>
        {tabLabel}
      </span>
    </Tab>
  );
}

export function SlideBrowserPlaylistTabStrip({ items }: SlideBrowserPlaylistTabStripProps) {
  const { currentPresentationId, openPresentation } = useNavigation();
  const { slides } = useSlides();

  const handleSelectPresentation = useCallback((presentationId: Id) => {
    openPresentation(presentationId);
  }, [openPresentation]);

  const renderTabItem = useCallback((item: PlaylistPresentationSequenceItem) => {
    return (
      <PlaylistTabItem
        key={item.entryId}
        item={item}
        active={item.presentation.id === currentPresentationId}
        onSelect={handleSelectPresentation}
      />
    );
  }, [currentPresentationId, handleSelectPresentation]);

  return (
    <header className="flex h-8 items-center gap-3 border-b border-stroke bg-surface-1/70 px-3">
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="min-w-max">
          <TabBar label="Playlist presentations" bordered={false}>
            {items.map(renderTabItem)}
          </TabBar>
        </div>
      </div>
      <span className="shrink-0 text-[11px] text-text-muted tabular-nums">
        {slides.length} slide{slides.length === 1 ? '' : 's'}
      </span>
    </header>
  );
}

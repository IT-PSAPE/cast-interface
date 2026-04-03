import { useCallback, type ReactNode } from 'react';
import type { Id } from '@core/types';
import { Tab, TabBar } from '../../../../components/display/tab-bar';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useSlides } from '../../../../contexts/slide-context';
import type { PlaylistPresentationSequenceItem } from '../hooks/use-playlist-presentation-sequence';

interface SlideBrowserPlaylistTabStripProps {
  items: PlaylistPresentationSequenceItem[];
  action?: ReactNode;
}

interface PlaylistTabItemProps {
  item: PlaylistPresentationSequenceItem;
  active: boolean;
  onSelect: (itemId: Id) => void;
}

function PlaylistTabItem({ item, active, onSelect }: PlaylistTabItemProps) {
  const handleSelect = useCallback(() => {
    onSelect(item.item.id);
  }, [item.item.id, onSelect]);

  const duplicateSuffix = item.occurrenceIndex > 1 ? ` (${item.occurrenceIndex})` : '';
  const tabLabel = `${item.item.title}${duplicateSuffix}`;

  return (
    <Tab active={active} onClick={handleSelect}>
      <span className="max-w-[180px] truncate" title={tabLabel}>
        {tabLabel}
      </span>
    </Tab>
  );
}

export function SlideBrowserPlaylistTabStrip({ items, action = null }: SlideBrowserPlaylistTabStripProps) {
  const { currentPlaylistContentItemId } = useNavigation();
  const { slides, selectPlaylistContentItem } = useSlides();

  const handleSelectPresentation = useCallback((itemId: Id) => {
    selectPlaylistContentItem(itemId);
  }, [selectPlaylistContentItem]);

  const renderTabItem = useCallback((item: PlaylistPresentationSequenceItem) => {
    return (
        <PlaylistTabItem
          key={item.entryId}
          item={item}
          active={item.item.id === currentPlaylistContentItemId}
          onSelect={handleSelectPresentation}
        />
      );
  }, [currentPlaylistContentItemId, handleSelectPresentation]);

  return (
    <header className="flex h-8 items-center gap-3 border-b border-border-primary bg-primary/70 px-3">
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="min-w-max">
          <TabBar label="Playlist items">
            {items.map(renderTabItem)}
          </TabBar>
        </div>
      </div>
      <span className="shrink-0 text-sm text-text-tertiary tabular-nums">
        {slides.length} slide{slides.length === 1 ? '' : 's'}
      </span>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

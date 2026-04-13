import type { ReactNode } from 'react';
import { Tabs } from '../../components/display/tabs';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlides } from '../../contexts/slide-context';
import type { SlideBrowserHeaderVariant } from './use-slide-browser-view';
import type { PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';

interface SlideBrowserPlaylistTabStripProps {
  items: PlaylistPresentationSequenceItem[];
  headerVariant: SlideBrowserHeaderVariant;
  action?: ReactNode;
}

function PlaylistTabItem({ item }: { item: PlaylistPresentationSequenceItem }) {
  const duplicateSuffix = item.occurrenceIndex > 1 ? ` (${item.occurrenceIndex})` : '';
  const tabLabel = `${item.item.title}${duplicateSuffix}`;

  return (
    <Tabs.Trigger value={item.item.id}>
      <span className="max-w-[180px] truncate" title={tabLabel}>
        {tabLabel}
      </span>
    </Tabs.Trigger>
  );
}

export function SlideBrowserPlaylistTabStrip({ items, headerVariant, action = null }: SlideBrowserPlaylistTabStripProps) {
  const { currentDeckItem, currentPlaylistDeckItemId } = useNavigation();
  const { slides, selectPlaylistDeckItem } = useSlides();

  return (
    <header className="flex h-8 items-center gap-3 border-b border-primary bg-primary/70 px-3">
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        {headerVariant === 'tabs' ? (
          <Tabs.Root value={currentPlaylistDeckItemId ?? undefined} onValueChange={selectPlaylistDeckItem}>
            <div className="min-w-max">
              <Tabs.List label="Playlist items">
                {items.map((item) => <PlaylistTabItem key={item.entryId} item={item} />)}
              </Tabs.List>
            </div>
          </Tabs.Root>
        ) : (
          <span className="truncate text-sm font-medium text-primary" title={currentDeckItem?.title}>
            {currentDeckItem?.title ?? 'No item selected'}
          </span>
        )}
      </div>
      <span className="shrink-0 text-sm text-tertiary tabular-nums">
        {slides.length} slide{slides.length === 1 ? '' : 's'}
      </span>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

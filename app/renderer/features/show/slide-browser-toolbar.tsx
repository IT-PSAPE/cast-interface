import { useState } from 'react';
import { AppWindow, ChevronDown, EllipsisVertical, LayoutGrid, List, RectangleHorizontal, Rows3 } from 'lucide-react';
import { Dropdown } from '../../components/form/dropdown';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { Tabs } from '../../components/display/tabs';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlides } from '../../contexts/slide-context';
import { useSlideBrowser } from './slide-browser-context';
import { LyricEditorModal } from './lyric-editor-modal';
import type { SlideBrowserHeaderVariant } from './use-slide-browser-view';
import type { PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';
import type { PlaylistBrowserMode, SlideBrowserMode } from '../../types/ui';

interface SlideBrowserToolbarProps {
  items: PlaylistPresentationSequenceItem[];
  headerVariant: SlideBrowserHeaderVariant;
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

const VIEW_MODE_LABELS: Record<SlideBrowserMode, string> = { grid: 'Grid', list: 'List' };
const PLAYLIST_MODE_LABELS: Record<PlaylistBrowserMode, string> = { current: 'Current', tabs: 'Tabs', continuous: 'Continuous' };

export function SlideBrowserToolbar({ items, headerVariant }: SlideBrowserToolbarProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { createSlide } = useSlides();
  const { slides, selectPlaylistDeckItem } = useSlides();
  const { currentDeckItem, currentPlaylistDeckItemId, isDetachedDeckBrowser } = useNavigation();
  const { slideBrowserMode, setSlideBrowserMode, playlistBrowserMode, setPlaylistBrowserMode, gridItemSize, gridSizeMin, gridSizeMax, gridSizeStep, setGridItemSize } = useSlideBrowser();

  const isGridMode = slideBrowserMode === 'grid';
  const showPlaylistModes = !isDetachedDeckBrowser && (isGridMode || slideBrowserMode === 'list');
  const showContentInfo = headerVariant !== 'hidden';

  function handleAddSlide() {
    if (currentDeckItem) void createSlide();
  }

  function handleOpenEditor() {
    if (currentDeckItem?.type === 'lyric') setIsEditorOpen(true);
  }

  function ViewIcon(){
    switch (slideBrowserMode) {
      case 'grid':
        return <LayoutGrid className='size-4' />;
      case 'list':
        return <List className='size-4' />;
      default:
        return null;
    }
  }

  function PlaylistIcon() {
    switch (playlistBrowserMode) {
      case 'current':
        return <RectangleHorizontal className='size-4' />;
      case 'tabs':
        return <AppWindow className='size-4' />;
      case 'continuous':
        return <Rows3 className='size-4' />;
      default:
        return null;
    }
  }

  return (
    <>
      <header className="flex h-8 items-center gap-2 border-b border-primary bg-primary/80 px-2">
        {/* Left: content info */}
        {showContentInfo && (
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
        )}

        {/* {showContentInfo && (
          <span className="shrink-0 text-sm text-tertiary tabular-nums">
            {slides.length} slide{slides.length === 1 ? '' : 's'}
          </span>
        )} */}

        {/* Right: toolbar controls */}
        <div className="ml-auto flex items-center gap-1.5">
          {isGridMode && <GridSizeSlider value={gridItemSize} min={gridSizeMin} max={gridSizeMax} step={gridSizeStep} onChange={setGridItemSize} />}

          {showPlaylistModes && (
            <Dropdown>
              <Dropdown.Trigger className="cursor-pointer rounded-sm bg-tertiary p-1 text-primary transition-colors hover:text-primary">
                <PlaylistIcon />
              </Dropdown.Trigger>
              <Dropdown.Panel placement="bottom-end">
                <Dropdown.Item onClick={() => setPlaylistBrowserMode('current')}>
                  <RectangleHorizontal className='size-4' /> Current
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setPlaylistBrowserMode('tabs')}>
                  <AppWindow className='size-4' /> Tabs
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setPlaylistBrowserMode('continuous')}>
                  <Rows3 className='size-4' /> Continuous
                </Dropdown.Item>
              </Dropdown.Panel>
            </Dropdown>
          )}

          <Dropdown>
            <Dropdown.Trigger className="cursor-pointer rounded-sm bg-tertiary p-1 text-primary transition-colors hover:text-primary">
              <ViewIcon />
            </Dropdown.Trigger>
            <Dropdown.Panel placement="bottom-end">
              <Dropdown.Item onClick={() => setSlideBrowserMode('grid')}>
                <LayoutGrid className='size-4' /> Grid
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSlideBrowserMode('list')}>
                <List className='size-4' /> List
              </Dropdown.Item>
            </Dropdown.Panel>
          </Dropdown>

          <Dropdown>
            <Dropdown.Trigger className="cursor-pointer rounded-sm bg-tertiary p-1 text-primary transition-colors hover:text-primary">
              <EllipsisVertical className="size-4" />
            </Dropdown.Trigger>
            <Dropdown.Panel placement="bottom-end">
              <Dropdown.Item onClick={handleAddSlide}>Add slide</Dropdown.Item>
              <Dropdown.Item onClick={handleOpenEditor}>Open lyric editor</Dropdown.Item>
            </Dropdown.Panel>
          </Dropdown>
        </div>
      </header>

      <LyricEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
    </>
  );
}

import { EmptyStatePanel } from '../../../components/empty-state-panel';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { usePlaylistPresentationSequence, type PlaylistPresentationSequenceItem } from '../hooks/use-playlist-presentation-sequence';
import { StageViewport } from '../../stage/components/stage-viewport';
import { SlideBrowserToolbar } from './slide-browser-toolbar';
import { SlideGrid } from './slide-grid';
import { SlideList } from './slide-list';
import { ContinuousSlideGrid } from './continuous-slide-grid';
import { ContinuousSlideList } from './continuous-slide-list';
import { SlideBrowserPlaylistTabStrip } from './slide-browser-playlist-tab-strip';
import { SlideBrowserPresentationStrip } from './slide-browser-presentation-strip';

export function SlideBrowser() {
  const { currentPresentation } = useNavigation();
  const { slides } = useSlides();
  const { slideBrowserMode, playlistBrowserMode } = useSlideBrowser();
  const { items } = usePlaylistPresentationSequence();
  const showStageViewport = slideBrowserMode === 'focus';
  const showPlaylistBrowserModes = slideBrowserMode === 'grid' || slideBrowserMode === 'list';
  const showTabsStrip = playlistBrowserMode === 'tabs' && showPlaylistBrowserModes && items.length > 0;
  const showContinuousHeader = playlistBrowserMode === 'continuous' && showPlaylistBrowserModes && items.length > 0;
  const showContinuousGrid = playlistBrowserMode === 'continuous' && slideBrowserMode === 'grid' && items.length > 0;
  const showContinuousList = playlistBrowserMode === 'continuous' && slideBrowserMode === 'list' && items.length > 0;
  const hasPresentation = Boolean(currentPresentation);
  const headerTitle = showContinuousHeader ? 'Playlist presentations' : (currentPresentation?.title ?? 'No presentation selected');
  const headerMeta = showContinuousHeader ? formatPlaylistMeta(items) : formatSlideMeta(slides.length);

  return (
    <main className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden bg-gradient-to-b from-surface-0/90 to-surface-0">
      {hasPresentation ? (
        <div className="row-start-1 min-h-0">
          {showTabsStrip ? (
            <SlideBrowserPlaylistTabStrip items={items} />
          ) : (
            <SlideBrowserPresentationStrip title={headerTitle} meta={headerMeta} />
          )}
        </div>
      ) : null}
      {hasPresentation ? (
        <section className="row-start-2 min-h-0 overflow-hidden">
          <section className={showStageViewport ? 'min-h-0 overflow-hidden p-2' : 'min-h-0'}>
            {showStageViewport ? <StageViewport /> : null}
            {slideBrowserMode === 'grid' && !showContinuousGrid ? <SlideGrid /> : null}
            {slideBrowserMode === 'list' && !showContinuousList ? <SlideList /> : null}
            {showContinuousGrid ? <ContinuousSlideGrid items={items} /> : null}
            {showContinuousList ? <ContinuousSlideList items={items} /> : null}
          </section>
        </section>
      ) : (
        <div className="row-start-2 min-h-0">
          <EmptyStatePanel
            glyph={<EmptyStateGlyph />}
            title="No presentation selected"
            description="Select a presentation from the library panel to load slides in the slide browser."
          />
        </div>
      )}
      <div className="row-start-3 min-h-0">
        <SlideBrowserToolbar />
      </div>
    </main>
  );
}

function formatSlideMeta(slideCount: number): string {
  return `${slideCount} slide${slideCount === 1 ? '' : 's'}`;
}

function formatPlaylistMeta(items: PlaylistPresentationSequenceItem[]): string {
  const slideCount = items.reduce((total, item) => total + item.slides.length, 0);
  const presentationLabel = `${items.length} presentation${items.length === 1 ? '' : 's'}`;
  const slideLabel = `${slideCount} slide${slideCount === 1 ? '' : 's'}`;
  return `${presentationLabel} · ${slideLabel}`;
}

function EmptyStateGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8 fill-none stroke-current" aria-hidden="true">
      <rect x="4" y="7" width="32" height="26" rx="3" strokeWidth="1.5" />
      <line x1="10" y1="15" x2="30" y2="15" strokeWidth="1.5" />
      <line x1="10" y1="21" x2="30" y2="21" strokeWidth="1.5" />
      <line x1="10" y1="27" x2="22" y2="27" strokeWidth="1.5" />
    </svg>
  );
}

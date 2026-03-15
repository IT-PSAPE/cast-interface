import { useMemo } from 'react';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { useWorkbench } from '../../../contexts/workbench-context';
import { usePlaylistPresentationSequence, type PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';

export type SlideBrowserContentVariant =
  | 'continuous-grid'
  | 'continuous-list'
  | 'empty'
  | 'focus'
  | 'single-grid'
  | 'single-list';

export type SlideBrowserHeaderVariant = 'hidden' | 'presentation' | 'tabs';

interface SlideBrowserView {
  contentVariant: SlideBrowserContentVariant;
  headerTitle: string;
  headerMeta: string;
  headerVariant: SlideBrowserHeaderVariant;
  showPlaylistBrowserModes: boolean;
  items: PlaylistPresentationSequenceItem[];
}

export function useSlideBrowserView(): SlideBrowserView {
  const { currentPresentation, isDetachedPresentationBrowser } = useNavigation();
  const { slides } = useSlides();
  const { slideBrowserMode, playlistBrowserMode } = useSlideBrowser();
  const { workbenchMode } = useWorkbench();
  const { items } = usePlaylistPresentationSequence();

  return useMemo(() => {
    const hasPresentation = Boolean(currentPresentation);
    const showPlaylistBrowserModes = workbenchMode === 'show'
      && !isDetachedPresentationBrowser
      && (slideBrowserMode === 'grid' || slideBrowserMode === 'list');
    const hasItems = items.length > 0;
    const showContinuousHeader = playlistBrowserMode === 'continuous' && showPlaylistBrowserModes && hasItems;
    const headerVariant: SlideBrowserHeaderVariant = !hasPresentation
      ? 'hidden'
      : playlistBrowserMode === 'tabs' && showPlaylistBrowserModes && hasItems
        ? 'tabs'
        : 'presentation';
    const contentVariant: SlideBrowserContentVariant = !hasPresentation
      ? 'empty'
      : slideBrowserMode === 'focus'
        ? 'focus'
        : showContinuousHeader && slideBrowserMode === 'grid'
          ? 'continuous-grid'
          : showContinuousHeader && slideBrowserMode === 'list'
            ? 'continuous-list'
            : slideBrowserMode === 'grid'
              ? 'single-grid'
              : 'single-list';
    const headerTitle = showContinuousHeader ? 'Playlist presentations' : (currentPresentation?.title ?? 'No presentation selected');
    const headerMeta = showContinuousHeader ? formatPlaylistMeta(items) : formatSlideMeta(slides.length);

    return {
      contentVariant,
      headerTitle,
      headerMeta,
      headerVariant,
      showPlaylistBrowserModes,
      items,
    };
  }, [currentPresentation, slideBrowserMode, playlistBrowserMode, workbenchMode, isDetachedPresentationBrowser, items, slides.length]);
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

import { useMemo } from 'react';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useSlideBrowser } from '../contexts/slide-browser-context';
import { useWorkbench } from '../../../../contexts/workbench-context';
import { usePlaylistPresentationSequence, type PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';

export type SlideBrowserContentVariant =
  | 'continuous-grid'
  | 'continuous-list'
  | 'empty'
  | 'focus'
  | 'single-grid'
  | 'single-list';

export type SlideBrowserHeaderVariant = 'hidden' | 'tabs';

interface SlideBrowserView {
  contentVariant: SlideBrowserContentVariant;
  headerVariant: SlideBrowserHeaderVariant;
  items: PlaylistPresentationSequenceItem[];
}

export function useSlideBrowserView(): SlideBrowserView {
  const { currentContentItem, isDetachedContentBrowser } = useNavigation();
  const { slideBrowserMode, playlistBrowserMode } = useSlideBrowser();
  const { state: { workbenchMode } } = useWorkbench();
  const { items } = usePlaylistPresentationSequence();

  return useMemo(() => {
    const hasPresentation = Boolean(currentContentItem);
    const showPlaylistBrowserModes = workbenchMode === 'show'
      && !isDetachedContentBrowser
      && (slideBrowserMode === 'grid' || slideBrowserMode === 'list');
    const hasItems = items.length > 0;
    const headerVariant: SlideBrowserHeaderVariant = !hasPresentation
      ? 'hidden'
      : playlistBrowserMode === 'tabs' && showPlaylistBrowserModes && hasItems
        ? 'tabs'
        : 'hidden';
    const contentVariant: SlideBrowserContentVariant = !hasPresentation
      ? 'empty'
      : slideBrowserMode === 'focus'
        ? 'focus'
        : playlistBrowserMode === 'continuous' && showPlaylistBrowserModes && hasItems && slideBrowserMode === 'grid'
          ? 'continuous-grid'
          : playlistBrowserMode === 'continuous' && showPlaylistBrowserModes && hasItems && slideBrowserMode === 'list'
            ? 'continuous-list'
            : slideBrowserMode === 'grid'
              ? 'single-grid'
              : 'single-list';
    return {
      contentVariant,
      headerVariant,
      items,
    };
  }, [currentContentItem, slideBrowserMode, playlistBrowserMode, workbenchMode, isDetachedContentBrowser, items]);
}

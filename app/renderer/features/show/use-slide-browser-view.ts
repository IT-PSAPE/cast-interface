import { useMemo } from 'react';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlideBrowser } from './slide-browser-context';
import { useWorkbench } from '../../contexts/workbench-context';
import { usePlaylistPresentationSequence, type PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';

export type SlideBrowserContentVariant =
  | 'continuous-grid'
  | 'continuous-list'
  | 'empty'
  | 'single-grid'
  | 'single-list';

export type SlideBrowserHeaderVariant = 'hidden' | 'current' | 'tabs' | 'continuous';

interface SlideBrowserView {
  contentVariant: SlideBrowserContentVariant;
  headerVariant: SlideBrowserHeaderVariant;
  items: PlaylistPresentationSequenceItem[];
}

export function useSlideBrowserView(): SlideBrowserView {
  const { currentDeckItem, isDetachedDeckBrowser } = useNavigation();
  const { slideBrowserMode, playlistBrowserMode } = useSlideBrowser();
  const { state: { workbenchMode } } = useWorkbench();
  const { items } = usePlaylistPresentationSequence();

  return useMemo(() => {
    const hasPresentation = Boolean(currentDeckItem);
    const showPlaylistBrowserModes = workbenchMode === 'show'
      && !isDetachedDeckBrowser
      && (slideBrowserMode === 'grid' || slideBrowserMode === 'list');
    const hasItems = items.length > 0;
    const headerVariant: SlideBrowserHeaderVariant = !hasPresentation || !showPlaylistBrowserModes || !hasItems
      ? 'hidden'
      : playlistBrowserMode === 'tabs'
        ? 'tabs'
        : playlistBrowserMode === 'continuous'
          ? 'continuous'
          : 'current';
    const contentVariant: SlideBrowserContentVariant = !hasPresentation
      ? 'empty'
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
  }, [currentDeckItem, slideBrowserMode, playlistBrowserMode, workbenchMode, isDetachedDeckBrowser, items]);
}

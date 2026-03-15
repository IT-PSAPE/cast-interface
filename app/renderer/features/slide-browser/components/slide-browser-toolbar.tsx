import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { useSlides } from '../../../contexts/slide-context';
import { PlaylistBrowserModeControl } from './playlist-browser-mode-control';
import { SlideBrowserModeControl } from './slide-browser-mode-control';

export function SlideBrowserToolbar() {
  const { createSlide } = useSlides();
  const { currentPresentation, isDetachedPresentationBrowser } = useNavigation();
  const { slideBrowserMode } = useSlideBrowser();
  const showPlaylistModes = !isDetachedPresentationBrowser && (slideBrowserMode === 'grid' || slideBrowserMode === 'list');

  function handleAddSlide() {
    if (!currentPresentation) return;
    void createSlide();
  }

  return (
    <footer className="flex items-center gap-2 border-t border-border-primary bg-primary/80 px-2 py-1">
      <IconButton label="Add slide" disabled={!currentPresentation} onClick={handleAddSlide}>
        <Icon.plus />
      </IconButton>

      <div className="ml-auto flex items-center gap-2">
        {showPlaylistModes ? (
          <>
            <PlaylistBrowserModeControl />
            <div className="h-5 w-px bg-border-primary" aria-hidden="true" />
          </>
        ) : null}
        <SlideBrowserModeControl />
      </div>
    </footer>
  );
}

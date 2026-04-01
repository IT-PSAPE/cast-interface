import { useState } from 'react';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { useSlides } from '../../../contexts/slide-context';
import { PlaylistBrowserModeControl } from './playlist-browser-mode-control';
import { SlideBrowserModeControl } from './slide-browser-mode-control';
import { LyricEditorModal } from './lyric-editor-modal';

export function SlideBrowserToolbar() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { createSlide } = useSlides();
  const { currentContentItem, isDetachedContentBrowser } = useNavigation();
  const { slideBrowserMode } = useSlideBrowser();
  const showPlaylistModes = !isDetachedContentBrowser && (slideBrowserMode === 'grid' || slideBrowserMode === 'list');

  function handleAddSlide() {
    if (!currentContentItem) return;
    void createSlide();
  }

  function handleOpenEditor() {
    if (currentContentItem?.type === 'lyric') {
      setIsEditorOpen(true);
    }
  }

  return (
    <>
      <footer className="flex items-center gap-2 border-t border-border-primary bg-primary/80 px-2 py-1">
        <IconButton label="Add slide" disabled={!currentContentItem} onClick={handleAddSlide}>
          <Icon.plus />
        </IconButton>

        <IconButton
          label="Open lyric editor"
          disabled={!currentContentItem || currentContentItem.type !== 'lyric'}
          onClick={handleOpenEditor}
        >
          <Icon.pencil_02 />
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

      <LyricEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
    </>
  );
}

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '../../../../components/controls/button';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useSlideBrowser } from '../contexts/slide-browser-context';
import { useSlides } from '../../../../contexts/slide-context';
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
        <Button label="Add slide" size="icon-md" disabled={!currentContentItem} onClick={handleAddSlide}>
          <Plus className="size-4" />
        </Button>

        <Button
          label="Open lyric editor"
          size="icon-md"
          disabled={!currentContentItem || currentContentItem.type !== 'lyric'}
          onClick={handleOpenEditor}
        >
          <Pencil className="size-4" />
        </Button>

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

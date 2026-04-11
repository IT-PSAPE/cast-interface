import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { GridSizeSlider } from '../../components/form/grid-size-slider';
import { useNavigation } from '../../contexts/navigation-context';
import { useSlideBrowser } from './slide-browser-context';
import { useSlides } from '../../contexts/slide-context';
import { PlaylistBrowserModeControl } from './playlist-browser-mode-control';
import { SlideBrowserModeControl } from './slide-browser-mode-control';
import { LyricEditorModal } from './lyric-editor-modal';

export function SlideBrowserToolbar() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { createSlide } = useSlides();
  const { currentContentItem, isDetachedContentBrowser } = useNavigation();
  const { slideBrowserMode, gridItemSize, gridSizeMin, gridSizeMax, gridSizeStep, setGridItemSize } = useSlideBrowser();
  const isGridMode = slideBrowserMode === 'grid';
  const showPlaylistModes = !isDetachedContentBrowser && (isGridMode || slideBrowserMode === 'list');

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
      <footer className="flex items-center gap-2 border-t border-primary bg-primary/80 px-2 py-1">
        <Button.Icon label="Add slide" disabled={!currentContentItem} onClick={handleAddSlide}>
          <Plus/>
        </Button.Icon>

        <Button.Icon label="Open lyric editor" disabled={!currentContentItem || currentContentItem.type !== 'lyric'} onClick={handleOpenEditor}>
          <Pencil/>
        </Button.Icon>

        <div className="ml-auto flex items-center gap-2">
          {showPlaylistModes && <PlaylistBrowserModeControl />}
          <SlideBrowserModeControl />
          {isGridMode && <GridSizeSlider value={gridItemSize} min={gridSizeMin} max={gridSizeMax} step={gridSizeStep} onChange={setGridItemSize} />}
        </div>
      </footer>

      <LyricEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
    </>
  );
}

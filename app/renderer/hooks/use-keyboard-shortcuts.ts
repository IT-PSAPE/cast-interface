import { useEffect } from 'react';
import type { SlideBrowserMode, PlaylistBrowserMode } from '../types/ui';
import { CANVAS_VIEW_LABELS, PLAYLIST_DISPLAY_MODE_LABELS } from '../utils/slides';
import { useCast } from '../contexts/cast-context';
import { useSlides } from '../contexts/slide-context';
import { useElements } from '../contexts/element/element-context';
import { useSlideBrowser } from '../features/show/slide-browser-context';
import { useWorkbench } from '../contexts/workbench-context';

export function useKeyboardShortcuts(): void {
  const { setStatusText } = useCast();
  const { slides, activateSlide, takeSlide, goNext, goPrev } = useSlides();
  const { selectedElementId, deleteSelected, nudgeSelection, copySelection, pasteSelection, undo, redo } = useElements();
  const { setSlideBrowserMode, setPlaylistBrowserMode } = useSlideBrowser();
  const { state: { workbenchMode } } = useWorkbench();
  const isEditSlideBrowser = workbenchMode === 'slide-editor' || workbenchMode === 'overlay-editor' || workbenchMode === 'template-editor';

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.getAttribute('contenteditable') === 'true';
      if (isEditable) return;

      const isMeta = event.metaKey || event.ctrlKey;
      if (isEditSlideBrowser && isMeta && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelection();
        return;
      }

      if (isEditSlideBrowser && isMeta && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        void pasteSelection();
        return;
      }

      if (isEditSlideBrowser && isMeta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) void redo();
        else void undo();
        return;
      }

      if (event.altKey && event.shiftKey && /^[1-3]$/.test(event.key)) {
        event.preventDefault();
        const playlistModes: PlaylistBrowserMode[] = ['current', 'tabs', 'continuous'];
        const nextPlaylistMode = playlistModes[Number(event.key) - 1];
        setPlaylistBrowserMode(nextPlaylistMode);
        setStatusText(`Playlist view: ${PLAYLIST_DISPLAY_MODE_LABELS[nextPlaylistMode]}`);
        return;
      }

      if (event.altKey && /^[1-2]$/.test(event.key)) {
        event.preventDefault();
        const viewModes: SlideBrowserMode[] = ['grid', 'list'];
        const next = viewModes[Number(event.key) - 1];
        setSlideBrowserMode(next);
        setStatusText(`View: ${CANVAS_VIEW_LABELS[next]}`);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        takeSlide();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (isEditSlideBrowser && selectedElementId) {
          event.preventDefault();
          void deleteSelected();
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        if (isEditSlideBrowser && selectedElementId) {
          event.preventDefault();
          void nudgeSelection(event.shiftKey ? 10 : 1, 0);
          return;
        }
        event.preventDefault();
        goNext();
        return;
      }

      if (event.key === 'ArrowLeft') {
        if (isEditSlideBrowser && selectedElementId) {
          event.preventDefault();
          void nudgeSelection(event.shiftKey ? -10 : -1, 0);
          return;
        }
        event.preventDefault();
        goPrev();
        return;
      }

      if (event.key === 'ArrowUp' && isEditSlideBrowser && selectedElementId) {
        event.preventDefault();
        void nudgeSelection(0, event.shiftKey ? -10 : -1);
        return;
      }

      if (event.key === 'ArrowDown' && isEditSlideBrowser && selectedElementId) {
        event.preventDefault();
        void nudgeSelection(0, event.shiftKey ? 10 : 1);
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        const jumpTo = Number(event.key) - 1;
        if (jumpTo < slides.length) activateSlide(jumpTo);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditSlideBrowser, slides.length, selectedElementId, activateSlide, takeSlide, goNext, goPrev, deleteSelected, setSlideBrowserMode, setPlaylistBrowserMode, setStatusText, nudgeSelection, copySelection, pasteSelection, undo, redo]);
}

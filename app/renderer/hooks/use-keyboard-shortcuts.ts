import { useEffect } from 'react';
import { SHORTCUTS, type ShortcutActionId } from '@core/shortcuts';
import type { SlideBrowserMode, PlaylistBrowserMode } from '../types/ui';
import { CANVAS_VIEW_LABELS, PLAYLIST_DISPLAY_MODE_LABELS } from '../utils/slides';
import { useCast } from '../contexts/app-context';
import { useSlides } from '../contexts/slide-context';
import { useElements } from '../contexts/canvas/canvas-context';
import { useDeckBrowser } from '../features/deck/deck-browser-context';
import { useWorkbench } from '../contexts/workbench-context';
import { matchesShortcut } from './use-keyboard-shortcuts-match';

export function useKeyboardShortcuts(): void {
  const { setStatusText } = useCast();
  const { slides, currentSlide, currentSlideIndex, isOutputArmedOnCurrent, activateSlide, takeSlide, goNext, goPrev, deleteSlide, setCurrentSlideIndex } = useSlides();
  const { selectedElementId, clearSelection, deleteSelected, nudgeSelection, copySelection, pasteSelection, undo, redo } = useElements();
  const { setSlideBrowserMode, setPlaylistBrowserMode } = useDeckBrowser();
  const { state: { workbenchMode } } = useWorkbench();
  const isEditSlideBrowser = workbenchMode === 'deck-editor' || workbenchMode === 'overlay-editor' || workbenchMode === 'template-editor';

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.getAttribute('contenteditable') === 'true';
      if (isEditable) return;

      const handlers: Record<ShortcutActionId, (event: KeyboardEvent, payload?: string) => void> = {
        copySelection: () => copySelection(),
        pasteSelection: () => { void pasteSelection(); },
        undo: () => { void undo(); },
        redo: () => { void redo(); },
        setPlaylistBrowserMode: (_event, digit) => {
          const modes: PlaylistBrowserMode[] = ['current', 'tabs', 'continuous'];
          const next = modes[Number(digit) - 1];
          setPlaylistBrowserMode(next);
          setStatusText(`Playlist view: ${PLAYLIST_DISPLAY_MODE_LABELS[next]}`);
        },
        setSlideBrowserMode: (_event, digit) => {
          const modes: SlideBrowserMode[] = ['grid', 'list'];
          const next = modes[Number(digit) - 1];
          setSlideBrowserMode(next);
          setStatusText(`View: ${CANVAS_VIEW_LABELS[next]}`);
        },
        takeSlide: () => takeSlide(),
        deleteSelected: () => {
          if (selectedElementId) void deleteSelected();
          else if (currentSlide) void deleteSlide(currentSlide.id);
        },
        clearSelection: () => clearSelection(),
        nudgeOrGoNext: (e) => {
          if (isEditSlideBrowser) {
            if (selectedElementId) void nudgeSelection(e.shiftKey ? 10 : 1, 0);
            return;
          }
          if (isOutputArmedOnCurrent) goNext();
          else setCurrentSlideIndex(currentSlideIndex + 1);
        },
        nudgeOrGoPrev: (e) => {
          if (isEditSlideBrowser) {
            if (selectedElementId) void nudgeSelection(e.shiftKey ? -10 : -1, 0);
            return;
          }
          if (isOutputArmedOnCurrent) goPrev();
          else setCurrentSlideIndex(currentSlideIndex - 1);
        },
        nudgeUp: (e) => { void nudgeSelection(0, e.shiftKey ? -10 : -1); },
        nudgeDown: (e) => { void nudgeSelection(0, e.shiftKey ? 10 : 1); },
        activateSlide: (_event, digit) => {
          const jumpTo = Number(digit) - 1;
          if (jumpTo < slides.length) activateSlide(jumpTo);
        },
      };

      for (const def of SHORTCUTS) {
        if (def.context === 'editSlideBrowser' && !isEditSlideBrowser) continue;
        if (def.context === 'editWithSelection' && !(isEditSlideBrowser && selectedElementId)) continue;
        const match = matchesShortcut(event, def);
        if (!match) continue;
        event.preventDefault();
        handlers[def.id](event, typeof match === 'string' ? match : undefined);
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditSlideBrowser, slides.length, selectedElementId, currentSlide, currentSlideIndex, isOutputArmedOnCurrent, activateSlide, takeSlide, goNext, goPrev, setCurrentSlideIndex, clearSelection, deleteSelected, deleteSlide, setSlideBrowserMode, setPlaylistBrowserMode, setStatusText, nudgeSelection, copySelection, pasteSelection, undo, redo]);
}

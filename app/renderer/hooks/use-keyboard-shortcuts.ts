import { useEffect } from 'react';
import type { CanvasViewMode } from '../types/ui';
import { CANVAS_VIEW_LABELS } from '../utils/slides';
import { useCast } from '../contexts/cast-context';
import { useSlides } from '../contexts/slide-context';
import { useElements } from '../contexts/element-context';
import { useUI } from '../contexts/ui-context';

export function useKeyboardShortcuts(): void {
  const { setStatusText } = useCast();
  const { slides, activateSlide, takeSlide, goNext, goPrev } = useSlides();
  const { selectedElementId, deleteSelected, nudgeSelection, copySelection, pasteSelection, undo, redo } = useElements();
  const { setCanvasViewMode, workspaceView } = useUI();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.getAttribute('contenteditable') === 'true';
      if (isEditable) return;

      const isMeta = event.metaKey || event.ctrlKey;
      if (workspaceView === 'edit' && isMeta && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelection();
        return;
      }

      if (workspaceView === 'edit' && isMeta && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        void pasteSelection();
        return;
      }

      if (workspaceView === 'edit' && isMeta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) void redo();
        else void undo();
        return;
      }

      if (event.altKey && /^[1-3]$/.test(event.key)) {
        event.preventDefault();
        const viewModes: CanvasViewMode[] = ['single', 'grid', 'outline'];
        const next = viewModes[Number(event.key) - 1];
        setCanvasViewMode(next);
        setStatusText(`View: ${CANVAS_VIEW_LABELS[next]}`);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        takeSlide();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (workspaceView === 'edit' && selectedElementId) {
          event.preventDefault();
          void deleteSelected();
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        if (workspaceView === 'edit' && selectedElementId) {
          event.preventDefault();
          void nudgeSelection(event.shiftKey ? 10 : 1, 0);
          return;
        }
        event.preventDefault();
        goNext();
        return;
      }

      if (event.key === 'ArrowLeft') {
        if (workspaceView === 'edit' && selectedElementId) {
          event.preventDefault();
          void nudgeSelection(event.shiftKey ? -10 : -1, 0);
          return;
        }
        event.preventDefault();
        goPrev();
        return;
      }

      if (event.key === 'ArrowUp' && workspaceView === 'edit' && selectedElementId) {
        event.preventDefault();
        void nudgeSelection(0, event.shiftKey ? -10 : -1);
        return;
      }

      if (event.key === 'ArrowDown' && workspaceView === 'edit' && selectedElementId) {
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
  }, [workspaceView, slides.length, selectedElementId, activateSlide, takeSlide, goNext, goPrev, deleteSelected, setCanvasViewMode, setStatusText, nudgeSelection, copySelection, pasteSelection, undo, redo]);
}

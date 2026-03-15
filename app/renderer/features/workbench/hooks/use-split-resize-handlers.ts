import { useCallback } from 'react';
import type {
  ResizableSplitResizeEndEvent,
  ResizableSplitResizeMoveEvent,
  ResizableSplitResizeStartEvent,
} from '../../../components/resizable-split';
import type { WorkbenchSplitId } from '../types/workbench-panel-layout';
import type {
  ResizeEndInput,
  ResizeMoveInput,
  ResizeStartInput,
} from './use-workbench-panel-layout';

interface SplitResizeHandlers {
  onResizeStart: (event: ResizableSplitResizeStartEvent) => void;
  onResize: (event: ResizableSplitResizeMoveEvent) => void;
  onResizeEnd: (event: ResizableSplitResizeEndEvent) => void;
}

export function useSplitResizeHandlers(
  splitId: WorkbenchSplitId,
  startDrag: (input: ResizeStartInput) => void,
  updateDrag: (input: ResizeMoveInput) => void,
  endDrag: (input: ResizeEndInput) => void,
): SplitResizeHandlers {
  const onResizeStart = useCallback((event: ResizableSplitResizeStartEvent) => {
    startDrag({
      splitId,
      handleIndex: event.handleIndex,
      pointerPosition: event.pointerPosition,
      paneSizes: event.paneSizes,
    });
  }, [splitId, startDrag]);

  const onResize = useCallback((event: ResizableSplitResizeMoveEvent) => {
    updateDrag({
      splitId,
      pointerPosition: event.pointerPosition,
    });
  }, [splitId, updateDrag]);

  const onResizeEnd = useCallback((_event: ResizableSplitResizeEndEvent) => {
    endDrag({ splitId });
  }, [splitId, endDrag]);

  return { onResizeStart, onResize, onResizeEnd };
}

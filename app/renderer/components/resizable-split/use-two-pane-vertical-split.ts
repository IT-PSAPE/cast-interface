import { useCallback, useRef, useState } from 'react';
import type { ResizableSplitResizeEndEvent, ResizableSplitResizeMoveEvent, ResizableSplitResizeStartEvent } from './resizable-split-root';

interface UseTwoPaneVerticalSplitOptions {
  topPaneId: string;
  bottomPaneId: string;
  defaultTopSize: number;
  defaultBottomSize: number;
  minTopSize: number;
  minBottomSize: number;
}

interface UseTwoPaneVerticalSplitResult {
  topSize: number;
  bottomSize: number;
  handleResizeStart: (event: ResizableSplitResizeStartEvent) => void;
  handleResize: (event: ResizableSplitResizeMoveEvent) => void;
  handleResizeEnd: (event: ResizableSplitResizeEndEvent) => void;
}

interface DragSessionState {
  startPointer: number;
  startTopSize: number;
  totalSize: number;
}

export function useTwoPaneVerticalSplit({
  topPaneId,
  bottomPaneId,
  defaultTopSize,
  defaultBottomSize,
  minTopSize,
  minBottomSize,
}: UseTwoPaneVerticalSplitOptions): UseTwoPaneVerticalSplitResult {
  const [topSize, setTopSize] = useState(defaultTopSize);
  const [bottomSize, setBottomSize] = useState(defaultBottomSize);

  const dragSessionRef = useRef<DragSessionState | null>(null);

  const handleResizeStart = useCallback((event: ResizableSplitResizeStartEvent) => {
    const measuredTopSize = coerceMeasuredSize(event.paneSizes[topPaneId], topSize);
    const measuredBottomSize = coerceMeasuredSize(event.paneSizes[bottomPaneId], bottomSize);
    const totalSize = measuredTopSize + measuredBottomSize;

    dragSessionRef.current = {
      startPointer: event.pointerPosition,
      startTopSize: measuredTopSize,
      totalSize,
    };

    setTopSize(measuredTopSize);
    setBottomSize(measuredBottomSize);
  }, [bottomPaneId, bottomSize, topPaneId, topSize]);

  const handleResize = useCallback((event: ResizableSplitResizeMoveEvent) => {
    const dragSession = dragSessionRef.current;
    if (!dragSession) return;

    const rawDelta = event.pointerPosition - dragSession.startPointer;
    const nextTopSize = clampTopPaneSize(
      dragSession.startTopSize + rawDelta,
      dragSession.totalSize,
      minTopSize,
      minBottomSize,
    );
    const nextBottomSize = Math.max(dragSession.totalSize - nextTopSize, 0);

    setTopSize(nextTopSize);
    setBottomSize(nextBottomSize);
  }, [minBottomSize, minTopSize]);

  const handleResizeEnd = useCallback((_event: ResizableSplitResizeEndEvent) => {
    dragSessionRef.current = null;
  }, []);

  return {
    topSize,
    bottomSize,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
  };
}

function coerceMeasuredSize(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function clampTopPaneSize(targetSize: number, totalSize: number, minTopSize: number, minBottomSize: number) {
  if (totalSize <= 0) return 0;

  if (totalSize < minTopSize + minBottomSize) {
    return clamp(targetSize, 0, totalSize);
  }

  return clamp(targetSize, minTopSize, totalSize - minBottomSize);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export type { UseTwoPaneVerticalSplitOptions, UseTwoPaneVerticalSplitResult };

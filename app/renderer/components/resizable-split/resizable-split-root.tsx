import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ResizableSplitHandle } from './resizable-split-handle';
import { ResizableSplitPane } from './resizable-split-pane';

interface ResizablePaneRenderConfig {
  id: string;
  visible: boolean;
  size: number;
  minSize: number;
  maxSize: number;
  flexible: boolean;
  className?: string;
  content: ReactNode;
}

interface ResizableSplitResizeStartEvent {
  handleIndex: number;
  pointerPosition: number;
  paneSizes: Record<string, number>;
}

interface ResizableSplitResizeMoveEvent {
  handleIndex: number;
  pointerPosition: number;
}

interface ResizableSplitResizeEndEvent {
  handleIndex: number;
}

interface HandleDescriptor {
  index: number;
  position: number;
}

interface ResizableSplitRootProps {
  orientation: 'horizontal' | 'vertical';
  panes: ResizablePaneRenderConfig[];
  className?: string;
  onResizeStart: (event: ResizableSplitResizeStartEvent) => void;
  onResize: (event: ResizableSplitResizeMoveEvent) => void;
  onResizeEnd: (event: ResizableSplitResizeEndEvent) => void;
}

export function ResizableSplitRoot({ orientation, panes, className = '', onResizeStart, onResize, onResizeEnd }: ResizableSplitRootProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activeHandleIndexRef = useRef<number | null>(null);

  const [handleDescriptors, setHandleDescriptors] = useState<HandleDescriptor[]>([]);
  const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);
  const [hoveredHandleIndex, setHoveredHandleIndex] = useState<number | null>(null);

  const measurePaneSizes = useCallback((): Record<string, number> => {
    const sizes: Record<string, number> = {};
    const container = containerRef.current;
    if (!container) return sizes;

    for (const pane of panes) {
      const paneElement = findPaneElement(container, pane.id);
      if (!paneElement) continue;
      sizes[pane.id] = orientation === 'horizontal' ? paneElement.offsetWidth : paneElement.offsetHeight;
    }

    return sizes;
  }, [orientation, panes]);

  const recalculateHandles = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextHandles: HandleDescriptor[] = [];

    for (let index = 0; index < panes.length - 1; index++) {
      const leftPane = panes[index];
      const rightPane = panes[index + 1];
      const isActiveBoundary = activeHandleIndexRef.current === index;
      const shouldRender = (leftPane.visible && rightPane.visible) || isActiveBoundary;
      if (!shouldRender) continue;

      const boundary = findBoundaryPosition(container, orientation, leftPane.id, rightPane.id);
      if (typeof boundary !== 'number') continue;

      nextHandles.push({ index, position: boundary });
    }

    setHandleDescriptors((current) => {
      if (areHandleDescriptorsEqual(current, nextHandles)) return current;
      return nextHandles;
    });
  }, [orientation, panes]);

  useLayoutEffect(() => {
    recalculateHandles();
  }, [recalculateHandles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      recalculateHandles();
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [recalculateHandles]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const handleIndex = readHandleIndex(event.currentTarget);
    if (handleIndex === null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const pointerPosition = extractPointerPosition(orientation, event.clientX, event.clientY);
    const paneSizes = measurePaneSizes();

    activePointerIdRef.current = event.pointerId;
    activeHandleIndexRef.current = handleIndex;
    setActiveHandleIndex(handleIndex);
    setHoveredHandleIndex(handleIndex);

    onResizeStart({ handleIndex, pointerPosition, paneSizes });
    recalculateHandles();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const handleIndex = readHandleIndex(event.currentTarget);
    if (handleIndex === null) return;
    if (activePointerIdRef.current !== event.pointerId) return;
    if (activeHandleIndexRef.current !== handleIndex) return;

    event.preventDefault();
    const pointerPosition = extractPointerPosition(orientation, event.clientX, event.clientY);
    onResize({ handleIndex, pointerPosition });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    completePointerSession(event.currentTarget, event.pointerId);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    completePointerSession(event.currentTarget, event.pointerId);
  }

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    const handleIndex = readHandleIndex(event.currentTarget);
    if (handleIndex === null) return;
    if (activeHandleIndexRef.current !== null && activeHandleIndexRef.current !== handleIndex) return;
    setHoveredHandleIndex(handleIndex);
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    const handleIndex = readHandleIndex(event.currentTarget);
    if (handleIndex === null) return;
    if (activeHandleIndexRef.current === handleIndex) return;
    setHoveredHandleIndex((current) => (current === handleIndex ? null : current));
  }

  function completePointerSession(target: HTMLDivElement, pointerId: number) {
    const handleIndex = readHandleIndex(target);
    if (handleIndex === null) return;
    if (activePointerIdRef.current !== pointerId) return;

    if (typeof target.hasPointerCapture === 'function'
      && target.hasPointerCapture(pointerId)
      && typeof target.releasePointerCapture === 'function') {
      target.releasePointerCapture(pointerId);
    }

    activePointerIdRef.current = null;
    activeHandleIndexRef.current = null;
    setActiveHandleIndex(null);
    setHoveredHandleIndex(null);

    onResizeEnd({ handleIndex });
    recalculateHandles();
  }

  function renderPane(pane: ResizablePaneRenderConfig) {
    return (
      <ResizableSplitPane
        key={pane.id}
        paneId={pane.id}
        orientation={orientation}
        size={pane.size}
        minSize={pane.minSize}
        maxSize={pane.maxSize}
        flexible={pane.flexible}
        visible={pane.visible}
        className={pane.className}
      >
        {pane.content}
      </ResizableSplitPane>
    );
  }

  function renderHandle(handle: HandleDescriptor) {
    return (
      <ResizableSplitHandle
        key={handle.index}
        orientation={orientation}
        handleIndex={handle.index}
        position={handle.position}
        active={activeHandleIndex === handle.index}
        hovered={hoveredHandleIndex === handle.index}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      />
    );
  }

  const paneNodes = panes.map(renderPane);
  const handleNodes = handleDescriptors.map(renderHandle);
  const orientationClass = orientation === 'horizontal' ? 'flex-row' : 'flex-col';

  return (
    <div ref={containerRef} className={`relative flex min-h-0 min-w-0 overflow-hidden ${orientationClass} ${className}`.trim()}>
      {paneNodes}
      {handleNodes}
    </div>
  );
}

function extractPointerPosition(orientation: 'horizontal' | 'vertical', x: number, y: number): number {
  return orientation === 'horizontal' ? x : y;
}

function readHandleIndex(target: HTMLDivElement): number | null {
  const rawIndex = target.dataset.handleIndex;
  if (!rawIndex) return null;

  const parsedIndex = Number(rawIndex);
  if (Number.isNaN(parsedIndex)) return null;

  return parsedIndex;
}

function areHandleDescriptorsEqual(current: HandleDescriptor[], next: HandleDescriptor[]): boolean {
  if (current.length !== next.length) return false;

  for (let index = 0; index < current.length; index++) {
    if (current[index].index !== next[index].index) return false;
    if (Math.abs(current[index].position - next[index].position) > 0.5) return false;
  }

  return true;
}

function findBoundaryPosition(
  container: HTMLDivElement,
  orientation: 'horizontal' | 'vertical',
  leftPaneId: string,
  rightPaneId: string,
): number | null {
  const leftPane = findPaneElement(container, leftPaneId);
  if (leftPane) {
    return orientation === 'horizontal'
      ? leftPane.offsetLeft + leftPane.offsetWidth
      : leftPane.offsetTop + leftPane.offsetHeight;
  }

  const rightPane = findPaneElement(container, rightPaneId);
  if (!rightPane) return null;

  return orientation === 'horizontal' ? rightPane.offsetLeft : rightPane.offsetTop;
}

function findPaneElement(container: HTMLDivElement, paneId: string): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-pane-id="${paneId}"]`);
}

export type {
  ResizablePaneRenderConfig,
  ResizableSplitResizeStartEvent,
  ResizableSplitResizeMoveEvent,
  ResizableSplitResizeEndEvent,
  ResizableSplitRootProps,
};

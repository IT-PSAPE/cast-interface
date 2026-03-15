import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

interface SceneStageViewport {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewportWidth: number;
  viewportHeight: number;
  sceneScale: number;
  sceneOffsetX: number;
  sceneOffsetY: number;
}

export interface SceneViewportTransform {
  viewportWidth: number;
  viewportHeight: number;
  sceneScale: number;
  sceneOffsetX: number;
  sceneOffsetY: number;
  sceneWidth: number;
  sceneHeight: number;
}

export function mapViewportPointToScene(clientX: number, clientY: number, containerRect: DOMRect, viewport: SceneViewportTransform): { x: number; y: number } {
  const normalizedX = (clientX - containerRect.left) * (viewport.viewportWidth / Math.max(1, containerRect.width));
  const normalizedY = (clientY - containerRect.top) * (viewport.viewportHeight / Math.max(1, containerRect.height));
  const rawSceneX = (normalizedX - viewport.sceneOffsetX) / Math.max(0.0001, viewport.sceneScale);
  const rawSceneY = (normalizedY - viewport.sceneOffsetY) / Math.max(0.0001, viewport.sceneScale);
  return {
    x: Math.min(viewport.sceneWidth, Math.max(0, rawSceneX)),
    y: Math.min(viewport.sceneHeight, Math.max(0, rawSceneY)),
  };
}

export function useSceneStageViewport(sceneWidth: number, sceneHeight: number, fixedViewport: ViewportSize | null): SceneStageViewport {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<ViewportSize>({ width: 1, height: 1 });

  useLayoutEffect(() => {
    if (fixedViewport) return;
    const target = containerRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setContainerSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
  }, [fixedViewport]);

  useEffect(() => {
    if (fixedViewport) return;
    const target = containerRef.current;
    if (!target) return;

    const observer = new ResizeObserver(() => {
      const rect = target.getBoundingClientRect();
      setContainerSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [fixedViewport]);

  return useMemo(() => {
    const viewportWidth = fixedViewport ? fixedViewport.width : Math.max(1, containerSize.width);
    const viewportHeight = fixedViewport ? fixedViewport.height : Math.max(1, containerSize.height);
    const sceneScale = Math.min(viewportWidth / sceneWidth, viewportHeight / sceneHeight);
    const drawWidth = sceneWidth * sceneScale;
    const drawHeight = sceneHeight * sceneScale;
    const sceneOffsetX = (viewportWidth - drawWidth) / 2;
    const sceneOffsetY = (viewportHeight - drawHeight) / 2;

    return {
      containerRef,
      viewportWidth,
      viewportHeight,
      sceneScale,
      sceneOffsetX,
      sceneOffsetY,
    };
  }, [containerSize.height, containerSize.width, fixedViewport, sceneHeight, sceneWidth]);
}

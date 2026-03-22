import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import type Konva from 'konva';
import { NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT } from '@core/ndi';
import { useNdi } from '../../../contexts/ndi-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { SceneNodeMedia } from '../../stage/rendering/scene-node-media';
import { SceneNodeShape } from '../../stage/rendering/scene-node-shape';
import { SceneNodeText } from '../../stage/rendering/scene-node-text';
import type { RenderNode } from '../../stage/rendering/scene-types';

const FRAME_INTERVAL_MS = 1000 / 30;

function renderNodeContent(node: RenderNode, onImageLoad?: () => void) {
  if (node.element.type === 'shape') return <SceneNodeShape node={node} />;
  if (node.element.type === 'text') return <SceneNodeText node={node} />;
  if (node.element.type === 'image' || node.element.type === 'video') return <SceneNodeMedia node={node} onLoad={onImageLoad} />;
  return null;
}

export function NdiFrameCapture() {
  const { outputState, outputConfigs } = useNdi();
  const { programScene } = useRenderScenes();
  const stageRef = useRef<Konva.Stage>(null);
  const normalizedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const normalizedContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameBufferRef = useRef<Uint8Array | null>(null);
  const enabled = outputState.audience;
  const hasVideoNodes = useMemo(
    () => programScene.nodes.some((node) => node.element.type === 'video'),
    [programScene.nodes],
  );

  const getReadbackContext = useCallback((sourceCanvas: HTMLCanvasElement): CanvasRenderingContext2D | null => {
    if (sourceCanvas.width === NDI_OUTPUT_WIDTH && sourceCanvas.height === NDI_OUTPUT_HEIGHT) {
      return sourceCanvas.getContext('2d', { willReadFrequently: true });
    }

    let normalizedCanvas = normalizedCanvasRef.current;
    if (!normalizedCanvas) {
      normalizedCanvas = document.createElement('canvas');
      normalizedCanvasRef.current = normalizedCanvas;
    }

    if (normalizedCanvas.width !== NDI_OUTPUT_WIDTH || normalizedCanvas.height !== NDI_OUTPUT_HEIGHT) {
      normalizedCanvas.width = NDI_OUTPUT_WIDTH;
      normalizedCanvas.height = NDI_OUTPUT_HEIGHT;
      normalizedContextRef.current = null;
    }

    let normalizedContext = normalizedContextRef.current;
    if (!normalizedContext) {
      normalizedContext = normalizedCanvas.getContext('2d', { willReadFrequently: true });
      normalizedContextRef.current = normalizedContext;
    }
    if (!normalizedContext) return null;

    normalizedContext.clearRect(0, 0, NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT);
    normalizedContext.drawImage(
      sourceCanvas,
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height,
      0,
      0,
      NDI_OUTPUT_WIDTH,
      NDI_OUTPUT_HEIGHT,
    );
    return normalizedContext;
  }, []);

  const captureFrame = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    try {
      const [layer] = stage.getLayers();
      const canvas = layer?.getNativeCanvasElement();
      if (!canvas) return;
      const ctx = getReadbackContext(canvas);
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT);
      const requiredSize = NDI_OUTPUT_WIDTH * NDI_OUTPUT_HEIGHT * 4;
      if (!frameBufferRef.current || frameBufferRef.current.byteLength !== requiredSize) {
        frameBufferRef.current = new Uint8Array(requiredSize);
      }
      frameBufferRef.current.set(imageData.data);
      window.castApi.sendNdiFrame(frameBufferRef.current.buffer as ArrayBuffer, NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT);
    } catch (error) {
      console.error('[NdiFrameCapture] Frame capture failed:', error);
    }
  }, [getReadbackContext]);

  const handleImageLoad = useCallback(() => {
    stageRef.current?.batchDraw();
    captureFrame();
  }, [captureFrame]);

  useEffect(() => {
    if (!enabled) return;

    const rafId = requestAnimationFrame(() => {
      stageRef.current?.batchDraw();
      captureFrame();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [captureFrame, enabled, programScene, outputConfigs.audience.withAlpha]);

  useEffect(() => {
    if (!enabled || !hasVideoNodes) return;

    let rafId: number | null = null;
    let running = true;
    let lastCaptureTime = 0;

    function tick(timestamp: number) {
      if (!running) return;

      if (timestamp - lastCaptureTime >= FRAME_INTERVAL_MS) {
        lastCaptureTime = timestamp;
        captureFrame();
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [captureFrame, enabled, hasVideoNodes]);

  if (!enabled) return null;

  const withAlpha = outputConfigs.audience.withAlpha;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: -99999,
        top: -99999,
        width: NDI_OUTPUT_WIDTH,
        height: NDI_OUTPUT_HEIGHT,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <Stage ref={stageRef} width={NDI_OUTPUT_WIDTH} height={NDI_OUTPUT_HEIGHT}>
        <Layer>
          {!withAlpha && (
            <Group>
              <SceneNodeShape node={{
                id: '__ndi-bg',
                element: {
                  id: '__ndi-bg',
                  slideId: '',
                  type: 'shape',
                  x: 0,
                  y: 0,
                  width: NDI_OUTPUT_WIDTH,
                  height: NDI_OUTPUT_HEIGHT,
                  rotation: 0,
                  opacity: 1,
                  zIndex: -1,
                  layer: 'content',
                  payload: { shape: 'rectangle', fillColor: '#000000', fillEnabled: true } as never,
                  createdAt: '',
                  updatedAt: '',
                },
                visual: {
                  visible: true,
                  locked: false,
                  flipX: false,
                  flipY: false,
                  fillEnabled: true,
                  fillColor: '#000000',
                  strokeEnabled: false,
                  strokeColor: '',
                  strokeWidth: 0,
                  strokePosition: 'inside',
                  shadowEnabled: false,
                  shadowColor: '',
                  shadowBlur: 0,
                  shadowOffsetX: 0,
                  shadowOffsetY: 0,
                },
                isVideo: false,
              }} />
            </Group>
          )}
          <Group>
            {programScene.nodes.map((node) => {
              if (node.visual.visible === false) return null;
              return (
                <Group
                  key={node.id}
                  x={node.element.x}
                  y={node.element.y}
                  width={node.element.width}
                  height={node.element.height}
                  rotation={node.element.rotation}
                  opacity={node.element.opacity}
                  scaleX={node.visual.flipX ? -1 : 1}
                  scaleY={node.visual.flipY ? -1 : 1}
                  offsetX={node.visual.flipX ? node.element.width : 0}
                  offsetY={node.visual.flipY ? node.element.height : 0}
                >
                  {renderNodeContent(node, handleImageLoad)}
                </Group>
              );
            })}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

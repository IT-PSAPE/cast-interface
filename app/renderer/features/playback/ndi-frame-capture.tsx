import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import type Konva from 'konva';
import { NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT } from '@core/ndi';
import type { NdiOutputName } from '@core/types';
import { useNdi } from '../../contexts/app-context';
import { SceneNodeMedia } from '../canvas/scene-node-media';
import { SceneNodeShape } from '../canvas/scene-node-shape';
import { SceneNodeText } from '../canvas/scene-node-text';
import type { RenderNode, RenderScene, SceneSurface } from '../canvas/scene-types';
import { useNdiCaptureSource } from './ndi-capture-source';

const FRAME_INTERVAL_MS = 1000 / 30;
// If the scene doesn't change for this long, send a heartbeat frame so
// NDI receivers don't flag the stream as stale.
const HEARTBEAT_MS = 500;

function renderNodeContent(node: RenderNode, surface: SceneSurface, onImageLoad?: () => void) {
  if (node.element.type === 'shape') return <SceneNodeShape node={node} />;
  if (node.element.type === 'text') return <SceneNodeText node={node} />;
  if (node.element.type === 'image' || node.element.type === 'video') return <SceneNodeMedia node={node} surface={surface} onLoad={onImageLoad} />;
  return null;
}

// Cheap signature used to decide whether the output has visibly changed
// since the last capture. Video nodes are excluded because their contents
// tick forward every frame without any RenderNode field changing.
function sceneSignature(nodes: readonly RenderNode[], withAlpha: boolean): string {
  let out = withAlpha ? 'a1' : 'a0';
  for (const node of nodes) {
    out += '|' + node.id + ':' + node.element.updatedAt + ':' + (node.visual.visible === false ? '0' : '1');
  }
  return out;
}

interface NdiFrameCaptureProps {
  /** Which named NDI output this capture feeds (must match a configured sender). */
  senderName: NdiOutputName;
  /** Scene to render off-screen and ship as frames. */
  scene: RenderScene;
  /** Logical surface used by element renderers (e.g. media surface routing). */
  surface?: SceneSurface;
  /** When false the capture loop is torn down and the off-screen stage is unmounted. */
  enabled: boolean;
}

export function NdiFrameCapture({ senderName, scene, surface = 'show', enabled }: NdiFrameCaptureProps) {
  const { state: { outputConfigs } } = useNdi();
  const stageRef = useRef<Konva.Stage>(null);
  const normalizedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const normalizedContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const pendingSkippedCapturesRef = useRef(0);
  const pendingHeartbeatCapturesRef = useRef(0);
  const sharedCaptureSource = useNdiCaptureSource(senderName);
  const hasVideoNodes = useMemo(
    () => scene.nodes.some((node) => node.element.type === 'video'),
    [scene.nodes],
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

  const captureFrame = useCallback((heartbeatCapture: boolean) => {
    const stage = stageRef.current;
    const canvas = sharedCaptureSource ?? stage?.getLayers()[0]?.getNativeCanvasElement();
    if (!canvas) return;

    try {
      const captureStartedAt = performance.now();
      const ctx = getReadbackContext(canvas);
      if (!ctx) return;
      const readbackStartedAt = performance.now();
      const imageData = ctx.getImageData(0, 0, NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT);
      const readbackDurationMs = performance.now() - readbackStartedAt;
      const captureDurationMs = performance.now() - captureStartedAt;
      window.castApi.sendNdiFrame(
        senderName,
        imageData.data.buffer as ArrayBuffer,
        NDI_OUTPUT_WIDTH,
        NDI_OUTPUT_HEIGHT,
        {
          captureDurationMs,
          readbackDurationMs,
          skippedCaptures: pendingSkippedCapturesRef.current,
          heartbeatCaptures: pendingHeartbeatCapturesRef.current + (heartbeatCapture ? 1 : 0),
        },
      );
      pendingSkippedCapturesRef.current = 0;
      pendingHeartbeatCapturesRef.current = 0;
    } catch (error) {
      console.error('[NdiFrameCapture] Frame capture failed:', error);
    }
  }, [getReadbackContext, senderName, sharedCaptureSource]);

  const handleImageLoad = useCallback(() => {
    stageRef.current?.batchDraw();
    captureFrame(false);
  }, [captureFrame]);

  // Single RAF loop driving capture at ~30fps. Skips the capture/send when
  // the scene hasn't changed and there are no video nodes, so an idle output
  // costs ~zero IPC traffic. Sends a heartbeat frame every HEARTBEAT_MS so
  // NDI receivers don't think the source died.
  const withAlpha = outputConfigs[senderName].withAlpha;
  useEffect(() => {
    if (!enabled) return;

    let rafId: number | null = null;
    let running = true;
    let lastCaptureTime = 0;
    let lastSentTime = 0;
    let lastSignature = '';

    function tick(timestamp: number) {
      if (!running) return;
      if (timestamp - lastCaptureTime >= FRAME_INTERVAL_MS) {
        lastCaptureTime = timestamp;
        const currentSignature = sceneSignature(scene.nodes, withAlpha);
        const signatureChanged = currentSignature !== lastSignature;
        const heartbeatDue = timestamp - lastSentTime >= HEARTBEAT_MS;
        if (signatureChanged || hasVideoNodes || heartbeatDue) {
          stageRef.current?.batchDraw();
          captureFrame(heartbeatDue && !signatureChanged && !hasVideoNodes);
          lastSignature = currentSignature;
          lastSentTime = timestamp;
        } else {
          pendingSkippedCapturesRef.current += 1;
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [captureFrame, enabled, hasVideoNodes, scene, withAlpha]);

  if (!enabled) return null;
  if (sharedCaptureSource) return null;

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
          {!withAlpha ? (
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
                  borderRadius: 0,
                  shadowEnabled: false,
                  shadowColor: '',
                  shadowBlur: 0,
                  shadowOffsetX: 0,
                  shadowOffsetY: 0,
                },
                isVideo: false,
              }} />
            </Group>
          ) : null}
          <Group>
            {scene.nodes.map((node) => {
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
                  {renderNodeContent(node, surface, handleImageLoad)}
                </Group>
              );
            })}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

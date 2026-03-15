import { useEffect, useRef } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import type Konva from 'konva';
import { NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT } from '@core/ndi';
import { useNdi } from '../../../contexts/ndi-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { SceneNodeShape } from '../../stage/rendering/scene-node-shape';
import { SceneNodeText } from '../../stage/rendering/scene-node-text';
import { SceneNodeImage } from '../../stage/rendering/scene-node-image';
import { SceneNodeVideo } from '../../stage/rendering/scene-node-video';
import type { RenderNode } from '../../stage/rendering/scene-types';

const FRAME_INTERVAL_MS = 1000 / 30;

function renderNodeContent(node: RenderNode) {
  if (node.element.type === 'shape') return <SceneNodeShape node={node} />;
  if (node.element.type === 'text') return <SceneNodeText node={node} />;
  if (node.element.type === 'image') return <SceneNodeImage node={node} />;
  if (node.element.type === 'video') return <SceneNodeVideo node={node} />;
  return null;
}

export function NdiFrameCapture() {
  const { outputState, outputConfigs } = useNdi();
  const { programScene } = useRenderScenes();
  const stageRef = useRef<Konva.Stage>(null);
  const enabled = outputState.audience;

  useEffect(() => {
    if (!enabled) return;

    let running = true;
    let lastCaptureTime = 0;

    function captureFrame(timestamp: number) {
      if (!running) return;

      if (timestamp - lastCaptureTime >= FRAME_INTERVAL_MS) {
        lastCaptureTime = timestamp;
        const stage = stageRef.current;
        if (stage) {
          try {
            const canvas = stage.toCanvas({ pixelRatio: 1 });
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imageData = ctx.getImageData(0, 0, NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT);
              window.castApi.sendNdiFrame(imageData.data.buffer, NDI_OUTPUT_WIDTH, NDI_OUTPUT_HEIGHT);
            }
          } catch (error) {
            console.error('[NdiFrameCapture] Frame capture failed:', error);
          }
        }
      }

      requestAnimationFrame(captureFrame);
    }

    requestAnimationFrame(captureFrame);
    return () => { running = false; };
  }, [enabled]);

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
                  {renderNodeContent(node)}
                </Group>
              );
            })}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

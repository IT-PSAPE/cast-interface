import { Fragment, useEffect, useMemo, useRef } from 'react';
import { Layer, Line, Rect, Stage, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import type { SlideFrame } from '@core/types';
import type { RenderNode, RenderScene } from './scene-types';
import { SceneNodeImage } from './scene-node-image';
import { SceneNodeShape } from './scene-node-shape';
import { SceneNodeText } from './scene-node-text';
import { SceneNodeVideo } from './scene-node-video';
import { useSceneStageEditor } from './use-scene-stage-editor';
import type { SceneViewportTransform } from './use-scene-stage-viewport';
import { useSceneStageViewport } from './use-scene-stage-viewport';

interface SceneStageProps {
  scene: RenderScene;
  editable?: boolean;
  className?: string;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  emitFramesFps?: number | null;
  onFrame?: (frame: SlideFrame) => void;
  fixedViewport?: { width: number; height: number } | null;
  onViewportChange?: (viewport: SceneViewportTransform) => void;
}

function rotationSnaps(): number[] {
  return Array.from({ length: 24 }, (_value, index) => index * 15);
}

function renderNodeContent(node: RenderNode) {
  if (node.element.type === 'shape') return <SceneNodeShape node={node} />;
  if (node.element.type === 'text') return <SceneNodeText node={node} />;
  if (node.element.type === 'image') return <SceneNodeImage node={node} />;
  if (node.element.type === 'video') return <SceneNodeVideo node={node} />;
  return null;
}

export function SceneStage({ scene, editable = false, className = '', onDrop, onDragOver, emitFramesFps = null, onFrame, fixedViewport = null, onViewportChange }: SceneStageProps) {
  const editor = useSceneStageEditor({ scene, editable });
  const viewport = useSceneStageViewport(scene.width, scene.height, fixedViewport);
  const snaps = useMemo(rotationSnaps, []);

  useEffect(() => {
    if (!onViewportChange) return;
    onViewportChange({
      viewportWidth: viewport.viewportWidth,
      viewportHeight: viewport.viewportHeight,
      sceneScale: viewport.sceneScale,
      sceneOffsetX: viewport.sceneOffsetX,
      sceneOffsetY: viewport.sceneOffsetY,
      sceneWidth: scene.width,
      sceneHeight: scene.height,
    });
  }, [onViewportChange, scene.height, scene.width, viewport.sceneOffsetX, viewport.sceneOffsetY, viewport.sceneScale, viewport.viewportHeight, viewport.viewportWidth]);

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!emitFramesFps || !onFrameRef.current) return;
    const intervalMs = Math.max(16, Math.round(1000 / emitFramesFps));
    const intervalId = setInterval(() => {
      const stage = editor.stageRef.current;
      if (!stage) return;
      const frameCallback = onFrameRef.current;
      if (!frameCallback) return;
      const scenePixelRatio = scene.width / Math.max(1, scene.width * viewport.sceneScale);
      const canvas = stage.toCanvas({
        x: viewport.sceneOffsetX,
        y: viewport.sceneOffsetY,
        width: scene.width * viewport.sceneScale,
        height: scene.height * viewport.sceneScale,
        pixelRatio: fixedViewport ? 1 : scenePixelRatio,
      });
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      const imageData = context.getImageData(0, 0, scene.width, scene.height);
      frameCallback({
        width: scene.width,
        height: scene.height,
        rgba: new Uint8ClampedArray(imageData.data),
        timestamp: Date.now(),
      });
    }, intervalMs);
    return () => clearInterval(intervalId);
  }, [editor.stageRef, emitFramesFps, fixedViewport, scene.height, scene.width, viewport.sceneOffsetX, viewport.sceneOffsetY, viewport.sceneScale]);

  function handleNodeClick(id: string, event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    editor.handleNodeSelect(id, event.evt.shiftKey);
  }

  function renderNode(node: RenderNode) {
    if (node.visual.visible === false) return null;

    function handleClick(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
      event.cancelBubble = true;
      handleNodeClick(node.id, event);
    }

    function handleDragStart() {
      editor.handleNodeDragStart(node.id);
    }

    function handleDragMove() {
      editor.handleNodeDragMove(node.id);
    }

    return (
      <Fragment key={node.id}>
        <Group
          ref={(nextNode) => editor.setNodeRef(node.id, nextNode)}
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
          draggable={editable && !node.visual.locked}
          onMouseDown={handleClick}
          onTap={handleClick}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={editor.handleNodeDragEnd}
          onTransform={editor.handleNodeTransform}
          onTransformEnd={editor.handleNodeTransformEnd}
        >
          {renderNodeContent(node)}
        </Group>
      </Fragment>
    );
  }

  return (
    <div ref={viewport.containerRef} className={`relative h-full w-full overflow-hidden ${className}`} onDrop={onDrop} onDragOver={onDragOver}>
      <Stage
        ref={editor.stageRef}
        width={viewport.viewportWidth}
        height={viewport.viewportHeight}
        className="h-full w-full"
        onMouseDown={editor.handleStageMouseDown}
        onMouseMove={editor.handleStageMouseMove}
        onMouseUp={editor.handleStageMouseUp}
      >
        <Layer>
          <Group name="scene-root" x={viewport.sceneOffsetX} y={viewport.sceneOffsetY} scaleX={viewport.sceneScale} scaleY={viewport.sceneScale}>
            {scene.nodes.map(renderNode)}
            {editable ? (
              <>
                {editor.guideLines.map((guide, index) => (
                  <Line key={`${guide.orientation}-${index}`} points={guide.points} stroke="#49D6A3" dash={[6, 4]} strokeWidth={1 / viewport.sceneScale} />
                ))}
                <Transformer
                  ref={editor.transformerRef}
                  rotateEnabled
                  rotationSnaps={editor.shiftPressed ? snaps : []}
                  rotationSnapTolerance={5}
                  anchorSize={10}
                  borderStroke="#4DA3FF"
                  anchorStroke="#0F1A2A"
                  anchorFill="#4DA3FF"
                  boundBoxFunc={(oldBox, newBox) => {
                    if (Math.abs(newBox.width) < 16 || Math.abs(newBox.height) < 16) return oldBox;
                    return newBox;
                  }}
                />
              </>
            ) : null}
          </Group>
        </Layer>

        {editable && editor.selectionBox ? (
          <Layer listening={false}>
            <Rect
              x={editor.selectionBox.x}
              y={editor.selectionBox.y}
              width={editor.selectionBox.width}
              height={editor.selectionBox.height}
              fill="#4DA3FF22"
              stroke="#4DA3FF"
              dash={[6, 4]}
            />
          </Layer>
        ) : null}
      </Stage>
    </div>
  );
}

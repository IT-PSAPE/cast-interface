import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Fragment } from 'react';
import { Layer, Line, Rect, Stage, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import type { RenderNode, RenderScene, SceneSurface } from './scene-types';
import { SceneNodeMedia } from './scene-node-media';
import { SceneNodeShape } from './scene-node-shape';
import { SceneNodeText } from './scene-node-text';
import { InlineTextEditor } from './inline-text-editor';
import { useSceneStageEditor } from './use-scene-stage-editor';
import type { SceneViewportTransform } from './use-scene-stage-viewport';
import { useSceneStageViewport } from './use-scene-stage-viewport';

interface SceneStageProps {
  scene: RenderScene;
  surface?: SceneSurface;
  editable?: boolean;
  className?: string;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  fixedViewport?: { width: number; height: number } | null;
  onViewportChange?: (viewport: SceneViewportTransform) => void;
}

function rotationSnaps(): number[] {
  return Array.from({ length: 24 }, (_value, index) => index * 15);
}

function renderNodeContent(node: RenderNode, surface: SceneSurface) {
  if (node.element.type === 'shape') return <SceneNodeShape node={node} />;
  if (node.element.type === 'text') return <SceneNodeText node={node} />;
  if (node.element.type === 'image' || node.element.type === 'video') return <SceneNodeMedia node={node} surface={surface} />;
  return null;
}

// ─── SceneNode ──────────────────────────────────────────────────────

interface SceneNodeProps {
  node: RenderNode;
  surface: SceneSurface;
  editable: boolean;
  isBeingEdited: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDoubleClick: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string) => void;
  onDragEnd: () => void;
  onTransform: () => void;
  onTransformEnd: () => void;
  setNodeRef: (id: string, node: Konva.Group | null) => void;
}

const SceneNode = memo(function SceneNode({
  node, surface, editable, isBeingEdited,
  onSelect, onDoubleClick, onDragStart, onDragMove, onDragEnd,
  onTransform, onTransformEnd, setNodeRef,
}: SceneNodeProps) {
  if (node.visual.visible === false) return null;

  function handleClick(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    event.cancelBubble = true;
    onSelect(node.id, event.evt.shiftKey);
  }

  function handleDblClick(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    event.cancelBubble = true;
    onDoubleClick(node.id);
  }

  function handleDragStart() {
    onDragStart(node.id);
  }

  function handleDragMove() {
    onDragMove(node.id);
  }

  function handleRef(ref: Konva.Group | null) {
    setNodeRef(node.id, ref);
  }

  return (
    <Fragment>
      <Group
        ref={handleRef}
        x={node.element.x}
        y={node.element.y}
        width={node.element.width}
        height={node.element.height}
        rotation={node.element.rotation}
        opacity={isBeingEdited ? 0 : node.element.opacity}
        scaleX={node.visual.flipX ? -1 : 1}
        scaleY={node.visual.flipY ? -1 : 1}
        offsetX={node.visual.flipX ? node.element.width : 0}
        offsetY={node.visual.flipY ? node.element.height : 0}
        draggable={editable && !node.visual.locked && !isBeingEdited}
        onMouseDown={handleClick}
        onTap={handleClick}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={onDragEnd}
        onTransform={onTransform}
        onTransformEnd={onTransformEnd}
      >
        {renderNodeContent(node, surface)}
      </Group>
    </Fragment>
  );
});

// ─── SceneStage ─────────────────────────────────────────────────────

export function SceneStage({ scene, surface = 'show', editable = false, className = '', onDrop, onDragOver, fixedViewport = null, onViewportChange }: SceneStageProps) {
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

  // The editor object itself is a fresh reference per render, but each of
  // these callbacks is internally `useCallback`-stable, so passing them
  // directly preserves identity across renders and lets `SceneNode`'s
  // `React.memo` skip re-renders when node data hasn't changed.
  const {
    handleNodeSelect,
    handleNodeDoubleClick,
    handleNodeDragStart,
    handleNodeDragMove,
  } = editor;

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
        <Layer listening={editable}>
          <Group name="scene-root" x={viewport.sceneOffsetX} y={viewport.sceneOffsetY} scaleX={viewport.sceneScale} scaleY={viewport.sceneScale}>
            {scene.nodes.map((node) => (
              <SceneNode
                key={node.id}
                node={node}
                surface={surface}
                editable={editable}
                isBeingEdited={editor.editingTextId === node.id}
                onSelect={handleNodeSelect}
                onDoubleClick={handleNodeDoubleClick}
                onDragStart={handleNodeDragStart}
                onDragMove={handleNodeDragMove}
                onDragEnd={editor.handleNodeDragEnd}
                onTransform={editor.handleNodeTransform}
                onTransformEnd={editor.handleNodeTransformEnd}
                setNodeRef={editor.setNodeRef}
              />
            ))}
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
      {editable && editor.editingTextId ? (
        <InlineTextEditor
          editingTextId={editor.editingTextId}
          effectiveElements={editor.effectiveElements}
          sceneOffsetX={viewport.sceneOffsetX}
          sceneOffsetY={viewport.sceneOffsetY}
          sceneScale={viewport.sceneScale}
          onCommit={editor.commitTextEdit}
          onCancel={editor.cancelTextEdit}
        />
      ) : null}
    </div>
  );
}

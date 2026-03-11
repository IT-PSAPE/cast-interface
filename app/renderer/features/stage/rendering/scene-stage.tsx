import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Layer, Line, Rect, Stage, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import type { SlideElement, SlideFrame, TextElementPayload } from '@core/types';
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

  function handleNodeDblClick(id: string) {
    editor.handleNodeDoubleClick(id);
  }

  function renderNode(node: RenderNode) {
    if (node.visual.visible === false) return null;
    const isBeingEdited = editor.editingTextId === node.id;

    function handleClick(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
      event.cancelBubble = true;
      handleNodeClick(node.id, event);
    }

    function handleDblClick(event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
      event.cancelBubble = true;
      handleNodeDblClick(node.id);
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

interface InlineTextEditorProps {
  editingTextId: string;
  effectiveElements: SlideElement[];
  sceneOffsetX: number;
  sceneOffsetY: number;
  sceneScale: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

function resolveInlineTextAlign(alignment: TextElementPayload['alignment']): 'left' | 'center' | 'right' | 'justify' {
  if (alignment === 'center') return 'center';
  if (alignment === 'right' || alignment === 'end') return 'right';
  if (alignment === 'justify') return 'justify';
  return 'left';
}

function measureInlineTextHeight({
  text,
  width,
  fontSize,
  lineHeight,
  fontWeight,
  fontStyle,
  fontFamily,
}: {
  text: string;
  width: number;
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  fontStyle: string;
  fontFamily: string;
}): number {
  if (typeof document === 'undefined') {
    return fontSize * lineHeight;
  }

  const measureNode = document.createElement('div');
  measureNode.style.position = 'absolute';
  measureNode.style.visibility = 'hidden';
  measureNode.style.pointerEvents = 'none';
  measureNode.style.left = '-99999px';
  measureNode.style.top = '0';
  measureNode.style.width = `${Math.max(width, fontSize)}px`;
  measureNode.style.whiteSpace = 'pre-wrap';
  measureNode.style.wordBreak = 'break-word';
  measureNode.style.overflowWrap = 'anywhere';
  measureNode.style.fontSize = `${fontSize}px`;
  measureNode.style.lineHeight = String(lineHeight);
  measureNode.style.fontWeight = fontWeight;
  measureNode.style.fontStyle = fontStyle;
  measureNode.style.fontFamily = fontFamily;
  measureNode.textContent = text.length > 0 ? text : ' ';
  document.body.appendChild(measureNode);
  const height = measureNode.getBoundingClientRect().height;
  document.body.removeChild(measureNode);
  return Math.max(height, fontSize * lineHeight);
}

function InlineTextEditor({ editingTextId, effectiveElements, sceneOffsetX, sceneOffsetY, sceneScale, onCommit, onCancel }: InlineTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const initialTextRef = useRef('');

  const element = effectiveElements.find((el) => el.id === editingTextId);
  const payload = element?.type === 'text' ? (element.payload as unknown as TextElementPayload) : null;

  useEffect(() => {
    if (!payload) return;
    const text = payload.text ?? '';
    setDraft(text);
    initialTextRef.current = text;
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.select();
    });
  }, [editingTextId]);

  const handleBlur = useCallback(() => {
    onCommit(draft);
  }, [draft, onCommit]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onCommit(draft);
    }
  }, [draft, onCommit, onCancel]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  if (!element || !payload) return null;

  const left = sceneOffsetX + element.x * sceneScale;
  const top = sceneOffsetY + element.y * sceneScale;
  const width = element.width * sceneScale;
  const height = element.height * sceneScale;
  const fontSize = payload.fontSize * sceneScale;
  const lineHeight = payload.lineHeight ?? 1.25;
  const fontWeight = payload.weight ?? '400';
  const fontStyle = payload.italic ? 'italic' : 'normal';
  const textAlign = resolveInlineTextAlign(payload.alignment);
  const verticalAlign = payload.verticalAlign ?? 'middle';
  const contentHeight = measureInlineTextHeight({
    text: draft,
    width: Math.max(width - 4, 1),
    fontSize,
    lineHeight,
    fontWeight,
    fontStyle,
    fontFamily: payload.fontFamily || 'sans-serif',
  });
  const innerHeight = Math.max(height - 4, 0);
  const remainingVerticalSpace = Math.max(0, innerHeight - contentHeight);
  const paddingTop = verticalAlign === 'top'
    ? 0
    : verticalAlign === 'bottom'
      ? remainingVerticalSpace
      : remainingVerticalSpace / 2;

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="absolute z-10 resize-none overflow-hidden border-2 border-[#4DA3FF] bg-transparent outline-none"
      style={{
        left,
        top,
        width,
        height,
        boxSizing: 'border-box',
        fontSize,
        lineHeight,
        fontWeight,
        fontStyle,
        fontFamily: payload.fontFamily || 'sans-serif',
        color: payload.color,
        textAlign,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        transformOrigin: 'top left',
        paddingTop,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        margin: 0,
      }}
    />
  );
}

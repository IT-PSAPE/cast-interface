import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import type { ElementUpdateInput, Id } from '@core/types';
import { useElements } from '../../../contexts/element-context';
import { resolveSnap } from './snap-guides';
import type { GuideLine, RenderScene } from './scene-types';
import { createDragSession, type DragSession } from './scene-stage-drag-session';
import { mapSnapBoxes } from './scene-stage-editor-utils';
import { useSceneStageShift } from './use-scene-stage-shift';
import { useSceneStageMarquee } from './use-scene-stage-marquee';
import { useSceneStageDraftBuffer } from './use-scene-stage-draft-buffer';

interface UseSceneStageEditorParams {
  scene: RenderScene;
  editable: boolean;
}

export function useSceneStageEditor({ scene, editable }: UseSceneStageEditorParams) {
  const {
    effectiveElements,
    selectedElementIds,
    selectElements,
    toggleElementSelection,
    selectElement,
    clearSelection,
    setDraftElements,
    commitElementUpdates,
    setCanvasInteracting,
  } = useElements();

  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Map<Id, Konva.Group>>(new Map());
  const dragStartByIdRef = useRef<Map<Id, { x: number; y: number }>>(new Map());
  const dragSessionRef = useRef<DragSession | null>(null);

  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
  const shiftPressed = useSceneStageShift(editable);
  const selectedIdsSet = useMemo(() => new Set(selectedElementIds), [selectedElementIds]);
  const { applyDraftPatch, flushDraftBuffer } = useSceneStageDraftBuffer({ setDraftElements });
  const marquee = useSceneStageMarquee({
    editable,
    stageRef,
    nodeRefs,
    selectedElementIds,
    selectElements,
    clearSelection,
  });

  const setNodeRef = useCallback((id: Id, node: Konva.Group | null) => {
    if (!node) {
      nodeRefs.current.delete(id);
      return;
    }
    nodeRefs.current.set(id, node);
  }, []);

  useEffect(() => {
    if (!editable) return;
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = selectedElementIds
      .map((id) => nodeRefs.current.get(id))
      .filter((node): node is Konva.Group => Boolean(node));
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [editable, selectedElementIds]);

  const collectUpdateFromNode = useCallback((id: Id): ElementUpdateInput | null => {
    const node = nodeRefs.current.get(id);
    const source = effectiveElements.find((element) => element.id === id);
    if (!node || !source) return null;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const width = Math.max(1, source.width * Math.abs(scaleX));
    const height = Math.max(1, source.height * Math.abs(scaleY));
    const update: ElementUpdateInput = {
      id,
      x: node.x(),
      y: node.y(),
      width,
      height,
      rotation: node.rotation(),
    };
    node.scaleX(scaleX < 0 ? -1 : 1);
    node.scaleY(scaleY < 0 ? -1 : 1);
    return update;
  }, [effectiveElements]);

  const commitSelectionFromNodes = useCallback(async () => {
    flushDraftBuffer();
    try {
      const updates = selectedElementIds
        .map((id) => collectUpdateFromNode(id))
        .filter((update): update is ElementUpdateInput => Boolean(update));
      await commitElementUpdates(updates);
    } finally {
      setCanvasInteracting(false);
    }
  }, [collectUpdateFromNode, commitElementUpdates, flushDraftBuffer, selectedElementIds, setCanvasInteracting]);

  const handleNodeSelect = useCallback((id: Id, toggle: boolean) => {
    if (!editable) return;
    if (toggle) toggleElementSelection(id);
    else selectElement(id);
  }, [editable, selectElement, toggleElementSelection]);

  const handleNodeDragStart = useCallback((id: Id) => {
    if (!editable) return;
    setCanvasInteracting(true);
    const nextSelection = selectedIdsSet.has(id) ? selectedElementIds : [id];
    const session = createDragSession(effectiveElements, nextSelection);
    selectElements(nextSelection);
    dragStartByIdRef.current.clear();
    for (const selectedId of nextSelection) {
      const element = session.elementById.get(selectedId);
      if (!element) continue;
      dragStartByIdRef.current.set(selectedId, { x: element.x, y: element.y });
    }
    dragSessionRef.current = session;
  }, [editable, effectiveElements, selectElements, selectedElementIds, selectedIdsSet, setCanvasInteracting]);

  const handleNodeDragMove = useCallback((id: Id) => {
    if (!editable) return;
    const node = nodeRefs.current.get(id);
    if (!node) return;
    const session = dragSessionRef.current;
    const selectedIds = session?.selectedSet.has(id) ? session.selectedIds : [id];
    const activeElement = session?.elementById.get(id) ?? effectiveElements.find((element) => element.id === id);
    if (!activeElement) return;

    const rawX = node.x();
    const rawY = node.y();

    const snap = resolveSnap(
      { id, x: rawX, y: rawY, width: activeElement.width, height: activeElement.height },
      session?.snapBoxes ?? mapSnapBoxes(effectiveElements, new Set(selectedIds)),
      scene.width,
      scene.height,
    );

    node.position({ x: snap.x, y: snap.y });
    setGuideLines(snap.guides);

    const anchorStart = dragStartByIdRef.current.get(id);
    if (!anchorStart) return;
    const dx = snap.x - anchorStart.x;
    const dy = snap.y - anchorStart.y;

    for (const selectedId of selectedIds) {
      const start = dragStartByIdRef.current.get(selectedId);
      if (!start) continue;
      applyDraftPatch(selectedId, { x: start.x + dx, y: start.y + dy });
    }
  }, [applyDraftPatch, editable, effectiveElements, scene.height, scene.width, selectedElementIds, selectedIdsSet]);

  const handleNodeDragEnd = useCallback(async () => {
    setGuideLines([]);
    dragSessionRef.current = null;
    await commitSelectionFromNodes();
  }, [commitSelectionFromNodes]);

  const handleNodeTransform = useCallback(() => {
    setCanvasInteracting(true);
    for (const id of selectedElementIds) {
      const update = collectUpdateFromNode(id);
      if (!update) continue;
      applyDraftPatch(id, {
        x: update.x,
        y: update.y,
        width: update.width,
        height: update.height,
        rotation: update.rotation,
      });
    }
  }, [applyDraftPatch, collectUpdateFromNode, selectedElementIds, setCanvasInteracting]);

  const handleNodeTransformEnd = useCallback(async () => {
    await commitSelectionFromNodes();
  }, [commitSelectionFromNodes]);

  return {
    stageRef,
    transformerRef,
    selectionBox: marquee.selectionBox,
    guideLines,
    shiftPressed,
    selectedIdsSet,
    setNodeRef,
    handleNodeSelect,
    handleNodeDragStart,
    handleNodeDragMove,
    handleNodeDragEnd,
    handleNodeTransform,
    handleNodeTransformEnd,
    handleStageMouseDown: marquee.handleStageMouseDown,
    handleStageMouseMove: marquee.handleStageMouseMove,
    handleStageMouseUp: marquee.handleStageMouseUp,
  };
}

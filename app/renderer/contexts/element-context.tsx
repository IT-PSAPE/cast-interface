import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { overlayToLayerElements } from '@core/presentation-layers';
import { isLyricPresentation } from '@core/presentation-entities';
import type { ElementUpdateInput, Id, MediaAsset, Overlay, OverlayUpdateInput, SlideElement } from '@core/types';
import { applyVisualPayload, readVisualPayload } from '@core/element-payload';
import { sortElements } from '../utils/slides';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useOverlayEditor } from './overlay-editor-context';
import { useSlideEditor } from './slide-editor-context';
import { useSlides } from './slide-context';
import { useWorkbench } from './workbench-context';
import { useElementCommands } from './use-element-commands';
import { useElementHistory } from './use-element-history';
import { useElementInspectorSync } from './use-element-inspector-sync';
import { useElementSelection } from './use-element-selection';
import type { ElementContextValue } from './element-context.types';

const ElementContext = createContext<ElementContextValue | null>(null);

export function ElementProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { currentPresentation } = useNavigation();
  const { currentSlide } = useSlides();
  const { currentOverlay, updateOverlayDraft } = useOverlayEditor();
  const { getSlideElements, replaceSlideElements } = useSlideEditor();
  const { workbenchMode } = useWorkbench();
  const isOverlayEdit = workbenchMode === 'overlay-editor';
  const isSlideEdit = workbenchMode === 'slide-editor';

  const [draftElements, setDraftElements] = useState<Record<Id, Partial<SlideElement>>>({});
  const [isCanvasInteracting, setCanvasInteracting] = useState(false);

  const baseElements = useMemo(() => {
    if (isOverlayEdit) {
      if (!currentOverlay) return [];
      return sortElements(overlayToLayerElements(currentOverlay));
    }
    if (!currentSlide) return [];
    return sortElements(getSlideElements(currentSlide.id));
  }, [currentOverlay, currentSlide, getSlideElements, isOverlayEdit]);

  const effectiveElements = useMemo(
    () => sortElements(baseElements.map((element) => ({ ...element, ...(draftElements[element.id] ?? {}) }))),
    [baseElements, draftElements],
  );

  const selection = useElementSelection({ effectiveElements });

  useEffect(() => {
    if (!isOverlayEdit) return;
    if (!currentOverlay) {
      selection.clearSelection();
      return;
    }
    if (isOverlaySelectionValid(currentOverlay, selection.primarySelectedElementId)) return;
    selection.clearSelection();
  }, [currentOverlay, isOverlayEdit, selection.clearSelection, selection.primarySelectedElementId]);

  const stageOverlayElementUpdates = useCallback((updates: ElementUpdateInput[]) => {
    if (!currentOverlay) return;
    updateOverlayDraft(applyOverlayDraftUpdates(currentOverlay, updates));
  }, [currentOverlay, updateOverlayDraft]);

  const saveElementUpdate = useCallback(async (input: ElementUpdateInput) => {
    if (isOverlayEdit) {
      stageOverlayElementUpdates([input]);
      return;
    }
    if (isSlideEdit) {
      if (!currentSlide) return;
      replaceSlideElements(currentSlide.id, applyElementUpdates(getSlideElements(currentSlide.id), [input]));
      return;
    }
    await mutate(() => window.castApi.updateElement(input));
  }, [currentSlide, getSlideElements, isOverlayEdit, isSlideEdit, mutate, replaceSlideElements, stageOverlayElementUpdates]);

  const saveElementUpdates = useCallback(async (updates: ElementUpdateInput[]) => {
    if (updates.length === 0) return;
    if (isOverlayEdit) {
      stageOverlayElementUpdates(updates);
      return;
    }
    if (isSlideEdit) {
      if (!currentSlide) return;
      replaceSlideElements(currentSlide.id, applyElementUpdates(getSlideElements(currentSlide.id), updates));
      return;
    }
    await mutate(() => {
      if (updates.length === 1) return window.castApi.updateElement(updates[0]);
      return window.castApi.updateElementsBatch(updates);
    });
  }, [currentSlide, getSlideElements, isOverlayEdit, isSlideEdit, mutate, replaceSlideElements, stageOverlayElementUpdates]);

  const inspector = useElementInspectorSync({
    selectedElementId: selection.primarySelectedElementId,
    selectedElement: selection.selectedElement,
    baseElements,
    isCanvasInteracting,
    draftElements,
    setDraftElements,
    saveElementUpdate,
  });

  const history = useElementHistory({
    baseElements,
    effectiveElements,
    currentSlide,
    historyKey: isOverlayEdit ? currentOverlay?.id ?? null : currentSlide?.id ?? null,
    selectedElementIds: selection.selectedElementIds,
    mutate,
    setStatusText,
    selectElements: selection.selectElements,
    setDraftElements,
    setCanvasInteracting,
    saveElementUpdates,
    replaceElements: isSlideEdit && currentSlide
      ? async (elements) => {
        replaceSlideElements(currentSlide.id, elements);
      }
      : undefined,
  });

  const deleteSelected = useCallback(async () => {
    const protectedLyricTextIds = getProtectedLyricTextSelectionIds(
      effectiveElements,
      selection.selectedElementIds,
      isLyricPresentation(currentPresentation),
    );
    if (protectedLyricTextIds.length > 0) {
      setStatusText('Lyrics always keep one text layer. Hide it instead of deleting it.');
      return;
    }
    const targetIds = getUnlockedSelectedElementIds(effectiveElements, selection.selectedElementIds);
    if (targetIds.length === 0) return;
    if (isOverlayEdit) {
      if (!currentOverlay) return;
      const nextElements = currentOverlay.elements.filter((element) => !targetIds.includes(element.id));
      updateOverlayDraft({ id: currentOverlay.id, elements: nextElements });
    } else if (isSlideEdit) {
      if (!currentSlide) return;
      const nextElements = getSlideElements(currentSlide.id).filter((element) => !targetIds.includes(element.id));
      replaceSlideElements(currentSlide.id, nextElements);
    } else {
      history.pushHistorySnapshot();
      await mutate(() => {
        if (targetIds.length === 1) return window.castApi.deleteElement(targetIds[0]);
        return window.castApi.deleteElementsBatch(targetIds);
      });
    }
    setStatusText('Deleted selected object(s)');
    selection.clearSelection();
    setDraftElements({});
  }, [currentOverlay, currentPresentation, currentSlide, effectiveElements, getSlideElements, history, isOverlayEdit, isSlideEdit, mutate, replaceSlideElements, selection, setStatusText, updateOverlayDraft]);

  const toggleElementVisibility = useCallback(async (id: Id, visible: boolean) => {
    const target = effectiveElements.find((element) => element.id === id);
    if (!target) return;
    const nextVisualState = { ...readVisualPayload(target.type, target.payload), visible };
    const nextPayload = applyVisualPayload(target.type, target.payload, nextVisualState);
    await saveElementUpdate({ id, payload: nextPayload });
    if (selection.primarySelectedElementId === id) inspector.setElementPayloadDraft(nextPayload);
    setStatusText(visible ? 'Object shown' : 'Object hidden');
  }, [effectiveElements, inspector, saveElementUpdate, selection.primarySelectedElementId, setStatusText]);

  const toggleElementLock = useCallback(async (id: Id, locked: boolean) => {
    const target = effectiveElements.find((element) => element.id === id);
    if (!target) return;
    const nextVisualState = { ...readVisualPayload(target.type, target.payload), locked };
    const nextPayload = applyVisualPayload(target.type, target.payload, nextVisualState);
    await saveElementUpdate({ id, payload: nextPayload });
    if (selection.primarySelectedElementId === id) inspector.setElementPayloadDraft(nextPayload);
  }, [effectiveElements, inspector, saveElementUpdate, selection.primarySelectedElementId]);

  const { createText, createShape, createFromMedia, createOverlay, toggleOverlay, importMedia, deleteMedia, changeMediaSrc } = useElementCommands({
    currentSlide,
    currentPresentation,
    mutate,
    setStatusText,
  });

  const value = useMemo<ElementContextValue>(() => ({
    selectedElementId: selection.primarySelectedElementId,
    selectedElementIds: selection.selectedElementIds,
    primarySelectedElementId: selection.primarySelectedElementId,
    selectedElement: selection.selectedElement,
    effectiveElements,
    baseElements,
    draftElements,
    elementDraft: inspector.elementDraft,
    elementPayloadDraft: inspector.elementPayloadDraft,
    lockAspectRatio: inspector.lockAspectRatio,
    isCanvasInteracting,
    selectElement: selection.selectElement,
    selectElements: selection.selectElements,
    toggleElementSelection: selection.toggleElementSelection,
    clearSelection: selection.clearSelection,
    setDraftElements,
    setElementDraft: inspector.setElementDraft,
    setElementPayloadDraft: inspector.setElementPayloadDraft,
    setLockAspectRatio: inspector.setLockAspectRatio,
    setCanvasInteracting,
    commitElementUpdates: history.commitElementUpdates,
    deleteSelected,
    toggleElementVisibility,
    toggleElementLock,
    nudgeSelection: history.nudgeSelection,
    copySelection: isOverlayEdit ? noopCopySelection : history.copySelection,
    pasteSelection: isOverlayEdit ? noopAsyncAction : history.pasteSelection,
    undo: isOverlayEdit ? noopAsyncAction : history.undo,
    redo: isOverlayEdit ? noopAsyncAction : history.redo,
    createText,
    createShape,
    createFromMedia: (asset: MediaAsset, x: number, y: number) => createFromMedia(asset, x, y),
    createOverlay,
    toggleOverlay,
    importMedia,
    deleteMedia,
    changeMediaSrc,
  }), [
    baseElements,
    createFromMedia,
    createOverlay,
    createShape,
    createText,
    deleteMedia,
    deleteSelected,
    draftElements,
    effectiveElements,
    history,
    importMedia,
    inspector,
    isOverlayEdit,
    isSlideEdit,
    isCanvasInteracting,
    selection,
    setDraftElements,
    toggleElementLock,
    toggleElementVisibility,
    toggleOverlay,
    changeMediaSrc,
  ]);

  return <ElementContext.Provider value={value}>{children}</ElementContext.Provider>;
}

export function useElements(): ElementContextValue {
  const ctx = useContext(ElementContext);
  if (!ctx) throw new Error('useElements must be used within ElementProvider');
  return ctx;
}

function applyElementUpdates(elements: SlideElement[], updates: ElementUpdateInput[]): SlideElement[] {
  if (updates.length === 0) return elements;
  const updatesById = new Map(updates.map((update) => [update.id, update]));
  return elements.map((element) => {
    const update = updatesById.get(element.id);
    if (!update) return element;
    return {
      ...element,
      x: update.x ?? element.x,
      y: update.y ?? element.y,
      width: update.width ?? element.width,
      height: update.height ?? element.height,
      rotation: update.rotation ?? element.rotation,
      opacity: update.opacity ?? element.opacity,
      zIndex: update.zIndex ?? element.zIndex,
      layer: update.layer ?? element.layer,
      payload: update.payload ?? element.payload,
    };
  });
}

function noopCopySelection() {}

async function noopAsyncAction() {}

export function isOverlaySelectionValid(overlay: Overlay, selectedElementId: Id | null): boolean {
  if (!selectedElementId) return false;
  if (overlay.elements.length === 0) return overlay.id === selectedElementId;
  return overlay.elements.some((element) => element.id === selectedElementId);
}

export function getProtectedLyricTextSelectionIds(effectiveElements: SlideElement[], selectedElementIds: Id[], isLyricsPresentation: boolean): Id[] {
  if (!isLyricsPresentation) return [];
  return effectiveElements
    .filter((element) => selectedElementIds.includes(element.id))
    .filter((element) => element.type === 'text')
    .map((element) => element.id);
}

function getUnlockedSelectedElementIds(effectiveElements: SlideElement[], selectedElementIds: Id[]): Id[] {
  return effectiveElements
    .filter((element) => selectedElementIds.includes(element.id))
    .filter((element) => !element.payload.locked)
    .map((element) => element.id);
}

function applyOverlayDraftUpdates(overlay: Overlay, updates: ElementUpdateInput[]): OverlayUpdateInput {
  if (updates.length === 0) {
    return { id: overlay.id, elements: overlay.elements };
  }

  if (overlay.elements.length === 0) {
    const fallbackUpdate = updates.find((update) => update.id === overlay.id);
    if (!fallbackUpdate) return { id: overlay.id, elements: overlay.elements };
    return {
      id: overlay.id,
      elements: [{
        id: overlay.id,
        slideId: overlay.id,
        type: overlay.type === 'shape' ? 'shape' : overlay.type === 'text' ? 'text' : overlay.type === 'video' ? 'video' : 'image',
        x: fallbackUpdate.x ?? overlay.x,
        y: fallbackUpdate.y ?? overlay.y,
        width: fallbackUpdate.width ?? overlay.width,
        height: fallbackUpdate.height ?? overlay.height,
        rotation: fallbackUpdate.rotation ?? 0,
        opacity: fallbackUpdate.opacity ?? overlay.opacity,
        zIndex: fallbackUpdate.zIndex ?? overlay.zIndex,
        layer: fallbackUpdate.layer ?? 'content',
        payload: fallbackUpdate.payload ?? overlay.payload,
        createdAt: overlay.createdAt,
        updatedAt: new Date().toISOString(),
      }],
    };
  }

  return {
    id: overlay.id,
    elements: applyElementUpdates(overlay.elements, updates),
  };
}

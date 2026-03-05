import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { Id, MediaAsset, SlideElement } from '@core/types';
import { applyVisualPayload, readVisualPayload } from '@core/element-payload';
import { sortElements } from '../utils/slides';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useSlides } from './slide-context';
import { useElementCommands } from './use-element-commands';
import { useElementHistory } from './use-element-history';
import { useElementInspectorSync } from './use-element-inspector-sync';
import { useElementSelection } from './use-element-selection';
import type { ElementContextValue } from './element-context.types';

const ElementContext = createContext<ElementContextValue | null>(null);

export function ElementProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { activeBundle, currentPresentation } = useNavigation();
  const { currentSlide } = useSlides();

  const [draftElements, setDraftElements] = useState<Record<Id, Partial<SlideElement>>>({});
  const [isCanvasInteracting, setCanvasInteracting] = useState(false);

  const baseElements = useMemo(() => {
    if (!activeBundle || !currentSlide) return [];
    return sortElements(activeBundle.slideElements.filter((element) => element.slideId === currentSlide.id));
  }, [activeBundle, currentSlide]);

  const effectiveElements = useMemo(
    () => sortElements(baseElements.map((element) => ({ ...element, ...(draftElements[element.id] ?? {}) }))),
    [baseElements, draftElements],
  );

  const selection = useElementSelection({ effectiveElements });

  const inspector = useElementInspectorSync({
    selectedElementId: selection.primarySelectedElementId,
    selectedElement: selection.selectedElement,
    baseElements,
    isCanvasInteracting,
    draftElements,
    setDraftElements,
    mutate,
  });

  const history = useElementHistory({
    baseElements,
    effectiveElements,
    currentSlide,
    selectedElementIds: selection.selectedElementIds,
    mutate,
    setStatusText,
    selectElements: selection.selectElements,
    setDraftElements,
    setCanvasInteracting,
  });

  const deleteSelected = useCallback(async () => {
    const targetIds = effectiveElements
      .filter((element) => selection.selectedElementIds.includes(element.id))
      .filter((element) => !element.payload.locked)
      .map((element) => element.id);
    if (targetIds.length === 0) return;
    history.pushHistorySnapshot();
    await mutate(() => {
      if (targetIds.length === 1) return window.castApi.deleteElement(targetIds[0]);
      return window.castApi.deleteElementsBatch(targetIds);
    });
    setStatusText('Deleted selected object(s)');
    selection.clearSelection();
    setDraftElements({});
  }, [effectiveElements, history, mutate, selection, setStatusText]);

  const toggleElementVisibility = useCallback(async (id: Id, visible: boolean) => {
    const target = effectiveElements.find((element) => element.id === id);
    if (!target) return;
    const nextVisualState = { ...readVisualPayload(target.type, target.payload), visible };
    const nextPayload = applyVisualPayload(target.type, target.payload, nextVisualState);
    await mutate(() => window.castApi.updateElement({ id, payload: nextPayload }));
    if (selection.primarySelectedElementId === id) inspector.setElementPayloadDraft(nextPayload);
    setStatusText(visible ? 'Object shown' : 'Object hidden');
  }, [effectiveElements, inspector, mutate, selection.primarySelectedElementId, setStatusText]);

  const toggleElementLock = useCallback(async (id: Id, locked: boolean) => {
    const target = effectiveElements.find((element) => element.id === id);
    if (!target) return;
    const nextVisualState = { ...readVisualPayload(target.type, target.payload), locked };
    const nextPayload = applyVisualPayload(target.type, target.payload, nextVisualState);
    await mutate(() => window.castApi.updateElement({ id, payload: nextPayload }));
    if (selection.primarySelectedElementId === id) inspector.setElementPayloadDraft(nextPayload);
  }, [effectiveElements, inspector, mutate, selection.primarySelectedElementId]);

  const { createText, createShape, createFromMedia, createOverlay, toggleOverlay, importMedia, deleteMedia, changeMediaSrc } = useElementCommands({
    activeBundle,
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
    copySelection: history.copySelection,
    pasteSelection: history.pasteSelection,
    undo: history.undo,
    redo: history.redo,
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

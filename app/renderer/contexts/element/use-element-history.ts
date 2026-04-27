import { useCallback, useEffect, useRef } from 'react';
import type { AppSnapshot, ElementCreateInput, ElementUpdateInput, Id, Slide, SlideElement } from '@core/types';
import type { SnapshotPatch } from '@core/snapshot-patch';
import { createId } from '../../utils/create-id';
import { buildSnapshotDiff } from './element-history-utils';
import { cloneElements, payloadSignature } from '../../utils/element-context-utils';

const HISTORY_LIMIT = 100;
type DraftPatchMap = Record<Id, Partial<SlideElement>>;

function payloadMatchesBaseValue(
  draftPayload: Partial<SlideElement>['payload'],
  basePayload: SlideElement['payload'],
): boolean {
  return (
    payloadSignature((draftPayload as SlideElement['payload'] | undefined) ?? null) ===
    payloadSignature((basePayload as SlideElement['payload'] | undefined) ?? null)
  );
}

export function clearDraftElementsSyncedWithBase(currentDrafts: DraftPatchMap, baseElements: SlideElement[]): DraftPatchMap {
  if (Object.keys(currentDrafts).length === 0) return currentDrafts;
  const baseById = new Map<Id, SlideElement>(baseElements.map((element) => [element.id, element]));
  const next = { ...currentDrafts };
  let changed = false;

  for (const id of Object.keys(currentDrafts)) {
    const currentPatch = next[id];
    if (!currentPatch) continue;
    const baseElement = baseById.get(id);
    if (!baseElement) {
      delete next[id];
      changed = true;
      continue;
    }
    const remainingPatch: Partial<SlideElement> = { ...currentPatch };
    let patchChanged = false;

    if (typeof currentPatch.x !== 'undefined' && currentPatch.x === baseElement.x) { delete remainingPatch.x; patchChanged = true; }
    if (typeof currentPatch.y !== 'undefined' && currentPatch.y === baseElement.y) { delete remainingPatch.y; patchChanged = true; }
    if (typeof currentPatch.width !== 'undefined' && currentPatch.width === baseElement.width) { delete remainingPatch.width; patchChanged = true; }
    if (typeof currentPatch.height !== 'undefined' && currentPatch.height === baseElement.height) { delete remainingPatch.height; patchChanged = true; }
    if (typeof currentPatch.rotation !== 'undefined' && currentPatch.rotation === baseElement.rotation) { delete remainingPatch.rotation; patchChanged = true; }
    if (typeof currentPatch.opacity !== 'undefined' && currentPatch.opacity === baseElement.opacity) { delete remainingPatch.opacity; patchChanged = true; }
    if (typeof currentPatch.zIndex !== 'undefined' && currentPatch.zIndex === baseElement.zIndex) { delete remainingPatch.zIndex; patchChanged = true; }
    if (typeof currentPatch.layer !== 'undefined' && currentPatch.layer === baseElement.layer) { delete remainingPatch.layer; patchChanged = true; }
    if (typeof currentPatch.payload !== 'undefined' && payloadMatchesBaseValue(currentPatch.payload, baseElement.payload)) { delete remainingPatch.payload; patchChanged = true; }
    if (!patchChanged) continue;

    changed = true;
    if (Object.keys(remainingPatch).length === 0) delete next[id];
    else next[id] = remainingPatch;
  }

  return changed ? next : currentDrafts;
}

interface UseElementHistoryInput {
  baseElements: SlideElement[];
  effectiveElements: SlideElement[];
  currentSlide: Slide | null;
  historyKey: string | null;
  selectedElementIds: Id[];
  mutatePatch: (action: () => Promise<SnapshotPatch>) => Promise<AppSnapshot>;
  setStatusText: (text: string) => void;
  selectElements: (ids: Id[]) => void;
  setDraftElements: React.Dispatch<React.SetStateAction<Record<Id, Partial<SlideElement>>>>;
  setCanvasInteracting: React.Dispatch<React.SetStateAction<boolean>>;
  saveElementUpdates: (updates: ElementUpdateInput[]) => Promise<void>;
  replaceElements?: (elements: SlideElement[]) => Promise<void>;
}

export function useElementHistory({
  baseElements,
  effectiveElements,
  currentSlide,
  historyKey,
  selectedElementIds,
  mutatePatch,
  setStatusText,
  selectElements,
  setDraftElements,
  setCanvasInteracting,
  saveElementUpdates,
  replaceElements,
}: UseElementHistoryInput) {
  const historyPastRef = useRef<SlideElement[][]>([]);
  const historyFutureRef = useRef<SlideElement[][]>([]);
  const clipboardRef = useRef<SlideElement[]>([]);
  const pasteCountRef = useRef(0);

  useEffect(() => {
    historyPastRef.current = [];
    historyFutureRef.current = [];
    clipboardRef.current = [];
    pasteCountRef.current = 0;
  }, [historyKey]);

  useEffect(() => {
    setDraftElements((current) => clearDraftElementsSyncedWithBase(current, baseElements));
  }, [baseElements, setDraftElements]);

  const pushHistorySnapshot = useCallback(() => {
    historyPastRef.current.push(cloneElements(baseElements));
    if (historyPastRef.current.length > HISTORY_LIMIT) historyPastRef.current.shift();
    historyFutureRef.current = [];
  }, [baseElements]);

  const applySnapshot = useCallback(async (target: SlideElement[]) => {
    if (replaceElements) {
      await replaceElements(target);
      setDraftElements({});
      setCanvasInteracting(false);
      return;
    }
    const diff = buildSnapshotDiff(baseElements, target);
    if (diff.creates.length === 0 && diff.updates.length === 0 && diff.deletes.length === 0) return;
    // Each batch returns a patch; mutatePatch applies it and queues the
    // next call so the snapshotRef stays correct for subsequent operations.
    if (diff.deletes.length > 0) await mutatePatch(() => window.castApi.deleteElementsBatch(diff.deletes));
    if (diff.updates.length > 0) await mutatePatch(() => window.castApi.updateElementsBatch(diff.updates));
    if (diff.creates.length > 0) await mutatePatch(() => window.castApi.createElementsBatch(diff.creates));
    setDraftElements({});
    setCanvasInteracting(false);
  }, [baseElements, mutatePatch, replaceElements, setCanvasInteracting, setDraftElements]);

  const commitElementUpdates = useCallback(async (updates: ElementUpdateInput[], withHistory = true) => {
    if (updates.length === 0) return;
    if (withHistory) pushHistorySnapshot();
    await saveElementUpdates(updates);
  }, [pushHistorySnapshot, saveElementUpdates]);

  const copySelection = useCallback(() => {
    const targets = baseElements.filter((element) => selectedElementIds.includes(element.id));
    if (targets.length === 0) return;
    clipboardRef.current = cloneElements(targets);
    pasteCountRef.current = 0;
    setStatusText(`Copied ${targets.length} object(s)`);
  }, [baseElements, selectedElementIds, setStatusText]);

  const pasteSelection = useCallback(async () => {
    if (!currentSlide || clipboardRef.current.length === 0) return;
    pushHistorySnapshot();
    pasteCountRef.current += 1;
    const offset = 24 * pasteCountRef.current;
    const creates: ElementCreateInput[] = clipboardRef.current.map((element) => ({
      id: createId(),
      slideId: currentSlide.id,
      type: element.type,
      x: element.x + offset,
      y: element.y + offset,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      opacity: element.opacity,
      zIndex: element.zIndex,
      layer: element.layer,
      payload: JSON.parse(JSON.stringify(element.payload)) as SlideElement['payload'],
    }));
    if (replaceElements) {
      await replaceElements([...baseElements, ...creates.map((input) => ({
        id: input.id!,
        slideId: input.slideId,
        type: input.type,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        rotation: input.rotation ?? 0,
        opacity: input.opacity ?? 1,
        zIndex: input.zIndex ?? 0,
        layer: input.layer ?? 'content',
        payload: input.payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))]);
    } else {
      await mutatePatch(() => window.castApi.createElementsBatch(creates));
    }
    selectElements(creates.map((input) => input.id!).reverse());
    setStatusText(`Pasted ${creates.length} object(s)`);
  }, [baseElements, currentSlide, mutatePatch, pushHistorySnapshot, replaceElements, selectElements, setStatusText]);

  const nudgeSelection = useCallback(async (dx: number, dy: number) => {
    const targets = effectiveElements.filter((element) => selectedElementIds.includes(element.id) && !element.payload.locked);
    if (targets.length === 0) return;
    const updates = targets.map((element) => ({ id: element.id, x: element.x + dx, y: element.y + dy }));
    await commitElementUpdates(updates);
  }, [commitElementUpdates, effectiveElements, selectedElementIds]);

  const undo = useCallback(async () => {
    const target = historyPastRef.current.pop();
    if (!target) return;
    historyFutureRef.current.push(cloneElements(baseElements));
    await applySnapshot(target);
    setStatusText('Undo');
  }, [applySnapshot, baseElements, setStatusText]);

  const redo = useCallback(async () => {
    const target = historyFutureRef.current.pop();
    if (!target) return;
    historyPastRef.current.push(cloneElements(baseElements));
    await applySnapshot(target);
    setStatusText('Redo');
  }, [applySnapshot, baseElements, setStatusText]);

  return { pushHistorySnapshot, commitElementUpdates, copySelection, pasteSelection, nudgeSelection, undo, redo };
}

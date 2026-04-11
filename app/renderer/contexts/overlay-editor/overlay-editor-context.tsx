import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { AppSnapshot, Id, Overlay, OverlayCreateInput, OverlayUpdateInput, SlideElement } from '@core/types';
import { cloneElements } from '../../utils/staged-editor-utils';
import { getOverlayDefaults } from '../../utils/slides';
import { createId } from '../../utils/create-id';
import { useStagedCollection } from '../../hooks/use-staged-collection';
import { useCast } from '../cast-context';
import { useOverlayDefaults } from '../overlay-defaults-context';
import { useProjectContent } from '../use-project-content';
import { useWorkbench } from '../workbench-context';

interface OverlayEditorContextValue {
  overlays: Overlay[];
  currentOverlayId: Id | null;
  currentOverlay: Overlay | null;
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  setCurrentOverlayId: (overlayId: Id | null) => void;
  updateOverlayDraft: (input: OverlayUpdateInput) => void;
  createOverlay: () => Promise<void>;
  deleteCurrentOverlay: () => Promise<void>;
  pushChanges: () => Promise<void>;
}

const OverlayEditorContext = createContext<OverlayEditorContextValue | null>(null);

export function OverlayEditorProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { state: { workbenchMode } } = useWorkbench();
  const { overlayDefaults } = useOverlayDefaults();
  const { overlays: persistedOverlays } = useProjectContent();

  const staged = useStagedCollection<Overlay>({
    persistedItems: persistedOverlays,
    signatureOf: overlaySignature,
    workbenchModeKey: 'overlay-editor',
    currentWorkbenchMode: workbenchMode,
  });

  const overlays = staged.items;

  const updateOverlayDraft = useCallback((input: OverlayUpdateInput) => {
    staged.setStagedItems((current) => {
      const source = current ?? persistedOverlays;
      return source.map((overlay) => {
        if (overlay.id !== input.id) return overlay;
        const nextElements = typeof input.elements === 'undefined' ? overlay.elements : cloneElements(input.elements);
        return {
          ...overlay,
          name: input.name ?? overlay.name,
          elements: nextElements,
          animation: input.animation ?? overlay.animation,
          updatedAt: new Date().toISOString(),
        };
      });
    });
  }, [persistedOverlays, staged]);

  const createOverlay = useCallback(async () => {
    const now = new Date().toISOString();
    const draft: Overlay = {
      id: createId(),
      type: 'text',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      opacity: 1,
      zIndex: 0,
      enabled: true,
      payload: {
        text: '',
        fontFamily: 'Avenir Next',
        fontSize: 48,
        color: '#FFFFFF',
        alignment: 'left',
        weight: '700',
      },
      createdAt: now,
      updatedAt: now,
      ...getOverlayDefaults({
        animationKind: overlayDefaults.animationKind,
        durationMs: overlayDefaults.durationMs,
        autoClearDurationMs: overlayDefaults.autoClearDurationMs,
      }),
    };
    staged.setStagedItems((current) => [...(current ?? persistedOverlays), draft]);
    staged.setCurrentItemId(draft.id);
    setStatusText('Created overlay');
  }, [overlayDefaults.autoClearDurationMs, overlayDefaults.animationKind, overlayDefaults.durationMs, persistedOverlays, setStatusText, staged]);

  const deleteCurrentOverlay = useCallback(async () => {
    if (!staged.currentItemId) return;
    staged.setStagedItems((current) => {
      const source = current ?? persistedOverlays;
      return source.filter((overlay) => overlay.id !== staged.currentItemId);
    });
    setStatusText('Deleted overlay');
  }, [staged, persistedOverlays, setStatusText]);

  const pushChanges = useCallback(async () => {
    if (!staged.stagedItems || staged.isPushingChanges) return;
    const stagedOverlays = staged.stagedItems;
    const stagedSig = stagedOverlays.map(overlaySignature).join();
    const persistedSig = persistedOverlays.map(overlaySignature).join();
    if (stagedSig === persistedSig) {
      staged.setStagedItems(null);
      return;
    }

    staged.setIsPushingChanges(true);
    try {
      let resolvedCurrentOverlayId = staged.currentItemId;
      const next = await mutate(async () => {
        let snapshot: AppSnapshot | null = null;
        let knownOverlays = persistedOverlays;
        const persistedById = new Map(persistedOverlays.map((overlay) => [overlay.id, overlay]));
        const stagedById = new Map(stagedOverlays.map((overlay) => [overlay.id, overlay]));

        for (const overlay of persistedOverlays) {
          if (stagedById.has(overlay.id)) continue;
          snapshot = await window.castApi.deleteOverlay(overlay.id);
          knownOverlays = snapshot.overlays;
        }

        for (const overlay of stagedOverlays) {
          if (persistedById.has(overlay.id)) continue;
          const previousIds = new Set(knownOverlays.map((item) => item.id));
          snapshot = await window.castApi.createOverlay(toOverlayCreateInput(overlay));
          knownOverlays = snapshot.overlays;
          const createdOverlay = knownOverlays.find((item) => !previousIds.has(item.id)) ?? null;
          if (createdOverlay && resolvedCurrentOverlayId === overlay.id) {
            resolvedCurrentOverlayId = createdOverlay.id;
          }
        }

        for (const overlay of stagedOverlays) {
          if (!persistedById.has(overlay.id)) continue;
          const persistedOverlay = persistedById.get(overlay.id);
          if (!persistedOverlay || overlaySignature(overlay) === overlaySignature(persistedOverlay)) continue;
          snapshot = await window.castApi.updateOverlay({
            id: overlay.id,
            name: overlay.name,
            elements: cloneElements(overlay.elements),
            animation: overlay.animation,
          });
          knownOverlays = snapshot.overlays;
        }

        if (snapshot) return snapshot;
        return window.castApi.getSnapshot();
      });

      staged.setStagedItems(null);
      const nextOverlays = next.overlays;
      const currentOverlayStillExists = resolvedCurrentOverlayId
        ? nextOverlays.some((overlay) => overlay.id === resolvedCurrentOverlayId)
        : false;
      if (!resolvedCurrentOverlayId || !currentOverlayStillExists) {
        resolvedCurrentOverlayId = nextOverlays[0]?.id ?? null;
      }
      staged.setCurrentItemId(resolvedCurrentOverlayId);
      setStatusText('Overlay changes pushed');
    } finally {
      staged.setIsPushingChanges(false);
    }
  }, [staged, mutate, persistedOverlays, setStatusText]);

  useEffect(() => {
    staged.registerAutoPush(() => void pushChanges());
  }, [staged, pushChanges]);

  const value = useMemo<OverlayEditorContextValue>(
    () => ({
      overlays,
      currentOverlayId: staged.currentItemId,
      currentOverlay: staged.currentItem,
      hasPendingChanges: staged.hasPendingChanges,
      isPushingChanges: staged.isPushingChanges,
      setCurrentOverlayId: staged.setCurrentItemId,
      updateOverlayDraft,
      createOverlay,
      deleteCurrentOverlay,
      pushChanges,
    }),
    [createOverlay, staged.currentItem, staged.currentItemId, deleteCurrentOverlay, staged.hasPendingChanges, staged.isPushingChanges, overlays, pushChanges, staged.setCurrentItemId, updateOverlayDraft],
  );

  return <OverlayEditorContext.Provider value={value}>{children}</OverlayEditorContext.Provider>;
}

export function useOverlayEditor(): OverlayEditorContextValue {
  const context = useContext(OverlayEditorContext);
  if (!context) throw new Error('useOverlayEditor must be used within OverlayEditorProvider');
  return context;
}

function toOverlayCreateInput(overlay: Overlay): OverlayCreateInput {
  return {
    name: overlay.name,
    elements: cloneElements(overlay.elements),
    animation: overlay.animation,
  };
}

function overlaySignature(overlay: Overlay): string {
  return JSON.stringify({
    id: overlay.id,
    name: overlay.name,
    animation: overlay.animation,
    elements: overlay.elements,
  });
}

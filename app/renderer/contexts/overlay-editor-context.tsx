import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppSnapshot, Id, Overlay, OverlayCreateInput, OverlayUpdateInput, SlideElement } from '@core/types';
import { getOverlayDefaults } from '../utils/slides';
import { createId } from '../utils/create-id';
import { useCast } from './cast-context';
import { useProjectContent } from './use-project-content';
import { useWorkbench } from './workbench-context';

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
  const { workbenchMode } = useWorkbench();
  const { overlays: persistedOverlays } = useProjectContent();
  const [currentOverlayId, setCurrentOverlayId] = useState<Id | null>(null);
  const [stagedOverlays, setStagedOverlays] = useState<Overlay[] | null>(null);
  const [isPushingChanges, setIsPushingChanges] = useState(false);
  const previousWorkbenchModeRef = useRef(workbenchMode);

  const overlays = stagedOverlays ?? persistedOverlays;
  const hasPendingChanges = useMemo(() => {
    if (!stagedOverlays) return false;
    return overlayCollectionSignature(stagedOverlays) !== overlayCollectionSignature(persistedOverlays);
  }, [persistedOverlays, stagedOverlays]);

  useEffect(() => {
    if (overlays.length === 0) {
      setCurrentOverlayId(null);
      return;
    }
    if (!currentOverlayId || !overlays.some((overlay) => overlay.id === currentOverlayId)) {
      setCurrentOverlayId(overlays[0].id);
    }
  }, [currentOverlayId, overlays]);

  const currentOverlay = useMemo(
    () => overlays.find((overlay) => overlay.id === currentOverlayId) ?? null,
    [currentOverlayId, overlays],
  );

  const updateOverlayDraft = useCallback((input: OverlayUpdateInput) => {
    setStagedOverlays((current) => {
      const source = current ?? persistedOverlays;
      const next = source.map((overlay) => {
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
      return next;
    });
  }, [persistedOverlays]);

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
      ...getOverlayDefaults(),
    };
    setStagedOverlays((current) => [...(current ?? persistedOverlays), draft]);
    setCurrentOverlayId(draft.id);
    setStatusText('Created overlay');
  }, [persistedOverlays, setStatusText]);

  const deleteCurrentOverlay = useCallback(async () => {
    if (!currentOverlayId) return;
    setStagedOverlays((current) => {
      const source = current ?? persistedOverlays;
      return source.filter((overlay) => overlay.id !== currentOverlayId);
    });
    setStatusText('Deleted overlay');
  }, [currentOverlayId, persistedOverlays, setStatusText]);

  const pushChanges = useCallback(async () => {
    if (!stagedOverlays || isPushingChanges) return;
    if (overlayCollectionSignature(stagedOverlays) === overlayCollectionSignature(persistedOverlays)) {
      setStagedOverlays(null);
      return;
    }

    setIsPushingChanges(true);
    try {
      let resolvedCurrentOverlayId = currentOverlayId;
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

      setStagedOverlays(null);
      const nextOverlays = next.overlays;
      const currentOverlayStillExists = resolvedCurrentOverlayId
        ? nextOverlays.some((overlay) => overlay.id === resolvedCurrentOverlayId)
        : false;
      if (!resolvedCurrentOverlayId || !currentOverlayStillExists) {
        resolvedCurrentOverlayId = nextOverlays[0]?.id ?? null;
      }
      setCurrentOverlayId(resolvedCurrentOverlayId);
      setStatusText('Overlay changes pushed');
    } finally {
      setIsPushingChanges(false);
    }
  }, [currentOverlayId, isPushingChanges, mutate, persistedOverlays, setStatusText, stagedOverlays]);

  useEffect(() => {
    const previousWorkbenchMode = previousWorkbenchModeRef.current;
    previousWorkbenchModeRef.current = workbenchMode;
    if (previousWorkbenchMode !== 'overlay-editor' || workbenchMode === 'overlay-editor') return;
    if (!hasPendingChanges || isPushingChanges) return;
    void pushChanges();
  }, [hasPendingChanges, isPushingChanges, pushChanges, workbenchMode]);

  const value = useMemo<OverlayEditorContextValue>(
    () => ({
      overlays,
      currentOverlayId,
      currentOverlay,
      hasPendingChanges,
      isPushingChanges,
      setCurrentOverlayId,
      updateOverlayDraft,
      createOverlay,
      deleteCurrentOverlay,
      pushChanges,
    }),
    [createOverlay, currentOverlay, currentOverlayId, deleteCurrentOverlay, hasPendingChanges, isPushingChanges, overlays, pushChanges, updateOverlayDraft],
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

function cloneElements(elements: SlideElement[]): SlideElement[] {
  return JSON.parse(JSON.stringify(elements)) as SlideElement[];
}

function overlayCollectionSignature(overlays: Overlay[]): string {
  return JSON.stringify(overlays.map(overlaySignature));
}

function overlaySignature(overlay: Overlay): string {
  return JSON.stringify({
    id: overlay.id,
    name: overlay.name,
    animation: overlay.animation,
    elements: overlay.elements,
  });
}

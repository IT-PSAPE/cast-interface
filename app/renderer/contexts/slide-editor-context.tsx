import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppSnapshot, Id, SlideElement } from '@core/types';
import { buildSnapshotDiff } from './element-history-utils';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { useSlides } from './slide-context';
import { useWorkbench } from './workbench-context';

interface SlideEditorContextValue {
  hasPendingChanges: boolean;
  isPushingChanges: boolean;
  getSlideElements: (slideId: Id) => SlideElement[];
  replaceSlideElements: (slideId: Id, elements: SlideElement[]) => void;
  pushChanges: () => Promise<void>;
}

const SlideEditorContext = createContext<SlideEditorContextValue | null>(null);

export function SlideEditorProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { activeBundle } = useNavigation();
  const { currentSlide } = useSlides();
  const { workbenchMode } = useWorkbench();
  const [stagedSlides, setStagedSlides] = useState<Record<Id, SlideElement[]>>({});
  const [isPushingChanges, setIsPushingChanges] = useState(false);
  const previousWorkbenchModeRef = useRef(workbenchMode);

  const persistedElementsBySlideId = useMemo(() => {
    const map = new Map<Id, SlideElement[]>();
    if (!activeBundle) return map;
    for (const element of activeBundle.slideElements) {
      const existing = map.get(element.slideId) ?? [];
      existing.push(element);
      map.set(element.slideId, existing);
    }
    return map;
  }, [activeBundle]);

  const hasPendingChanges = useMemo(() => {
    if (!activeBundle) return false;
    for (const slideId of Object.keys(stagedSlides)) {
      const persisted = persistedElementsBySlideId.get(slideId) ?? [];
      const staged = stagedSlides[slideId] ?? [];
      if (slideElementsSignature(persisted) !== slideElementsSignature(staged)) return true;
    }
    return false;
  }, [activeBundle, persistedElementsBySlideId, stagedSlides]);

  const getSlideElements = useCallback((slideId: Id) => {
    return stagedSlides[slideId] ?? persistedElementsBySlideId.get(slideId) ?? [];
  }, [persistedElementsBySlideId, stagedSlides]);

  const replaceSlideElements = useCallback((slideId: Id, elements: SlideElement[]) => {
    setStagedSlides((current) => ({
      ...current,
      [slideId]: cloneElements(elements),
    }));
  }, []);

  const pushChanges = useCallback(async () => {
    if (!activeBundle || isPushingChanges) return;
    const pendingSlideIds = Object.keys(stagedSlides).filter((slideId) => {
      const persisted = persistedElementsBySlideId.get(slideId) ?? [];
      const staged = stagedSlides[slideId] ?? [];
      return slideElementsSignature(persisted) !== slideElementsSignature(staged);
    });
    if (pendingSlideIds.length === 0) {
      setStagedSlides({});
      return;
    }

    setIsPushingChanges(true);
    try {
      const next = await mutate(async () => {
        let snapshot: AppSnapshot | null = null;
        for (const slideId of pendingSlideIds) {
          const persisted = persistedElementsBySlideId.get(slideId) ?? [];
          const staged = stagedSlides[slideId] ?? [];
          const diff = buildSnapshotDiff(persisted, staged);
          if (diff.deletes.length > 0) snapshot = await window.castApi.deleteElementsBatch(diff.deletes);
          if (diff.updates.length > 0) {
            snapshot = diff.updates.length === 1
              ? await window.castApi.updateElement(diff.updates[0])
              : await window.castApi.updateElementsBatch(diff.updates);
          }
          if (diff.creates.length > 0) {
            snapshot = diff.creates.length === 1
              ? await window.castApi.createElement(diff.creates[0])
              : await window.castApi.createElementsBatch(diff.creates);
          }
        }
        if (snapshot) return snapshot;
        return window.castApi.getSnapshot();
      });

      setStagedSlides({});
      if (currentSlide && !next.bundles.some((bundle) => bundle.slides.some((slide) => slide.id === currentSlide.id))) {
        setStatusText('Slide changes pushed');
        return;
      }
      setStatusText('Slide changes pushed');
    } finally {
      setIsPushingChanges(false);
    }
  }, [activeBundle, currentSlide, isPushingChanges, mutate, persistedElementsBySlideId, setStatusText, stagedSlides]);

  useEffect(() => {
    const previousWorkbenchMode = previousWorkbenchModeRef.current;
    previousWorkbenchModeRef.current = workbenchMode;
    if (previousWorkbenchMode !== 'slide-editor' || workbenchMode === 'slide-editor') return;
    if (!hasPendingChanges || isPushingChanges) return;
    void pushChanges();
  }, [hasPendingChanges, isPushingChanges, pushChanges, workbenchMode]);

  const value = useMemo<SlideEditorContextValue>(() => ({
    hasPendingChanges,
    isPushingChanges,
    getSlideElements,
    replaceSlideElements,
    pushChanges,
  }), [getSlideElements, hasPendingChanges, isPushingChanges, pushChanges, replaceSlideElements]);

  return <SlideEditorContext.Provider value={value}>{children}</SlideEditorContext.Provider>;
}

export function useSlideEditor(): SlideEditorContextValue {
  const context = useContext(SlideEditorContext);
  if (!context) throw new Error('useSlideEditor must be used within SlideEditorProvider');
  return context;
}

function cloneElements(elements: SlideElement[]): SlideElement[] {
  return JSON.parse(JSON.stringify(elements)) as SlideElement[];
}

function slideElementsSignature(elements: SlideElement[]): string {
  return JSON.stringify(elements);
}

import { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { AppSnapshot, Id, Slide, SlideElement } from '@core/types';
import { sortSlides, sortElements, clamp } from '../utils/slides';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { usePresentationLayers } from './presentation-layer-context';

interface SlideContextValue {
  slides: Slide[];
  currentSlideIndex: number;
  liveSlideIndex: number;
  currentSlide: Slide | null;
  liveSlide: Slide | null;
  liveElements: SlideElement[];
  slideElementsById: Map<Id, SlideElement[]>;
  setCurrentSlideIndex: (idx: number) => void;
  activateSlide: (idx: number) => void;
  takeSlide: () => void;
  goNext: () => void;
  goPrev: () => void;
  focusPresentationSlide: (presentationId: Id, index: number) => void;
  activatePresentationSlide: (presentationId: Id, index: number) => void;
  createSlide: () => Promise<void>;
  updateCurrentSlideNotes: (notes: string) => Promise<void>;
}

const SlideContext = createContext<SlideContextValue | null>(null);

export function SlideProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { activeBundle, currentPresentationId, openPresentation } = useNavigation();
  const { showContentLayer } = usePresentationLayers();
  const pendingPresentationSlideActionRef = useRef<{ presentationId: Id; index: number; action: 'focus' | 'activate' } | null>(null);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [liveSlideIndex, setLiveSlideIndex] = useState(0);

  const slides = useMemo(() => {
    if (!activeBundle || !currentPresentationId) return [];
    return sortSlides(activeBundle.slides.filter((s) => s.presentationId === currentPresentationId));
  }, [activeBundle, currentPresentationId]);

  useEffect(() => {
    if (slides.length === 0) {
      if (currentSlideIndex !== 0) setCurrentSlideIndex(0);
      if (liveSlideIndex !== 0) setLiveSlideIndex(0);
      return;
    }
    if (currentSlideIndex >= slides.length) setCurrentSlideIndex(slides.length - 1);
    if (liveSlideIndex >= slides.length) setLiveSlideIndex(slides.length - 1);
  }, [slides.length, currentSlideIndex, liveSlideIndex]);

  // Reset indices when presentation changes
  useEffect(() => {
    setCurrentSlideIndex(0);
    setLiveSlideIndex(0);
  }, [currentPresentationId]);

  useEffect(() => {
    const pendingAction = pendingPresentationSlideActionRef.current;
    if (!pendingAction) return;
    if (pendingAction.presentationId !== currentPresentationId) return;
    if (slides.length === 0) {
      pendingPresentationSlideActionRef.current = null;
      return;
    }

    const nextIndex = clamp(pendingAction.index, 0, slides.length - 1);
    if (pendingAction.action === 'activate') {
      setCurrentSlideIndex(nextIndex);
      setLiveSlideIndex(nextIndex);
      showContentLayer();
      setStatusText(`Live slide ${nextIndex + 1}`);
    } else {
      setCurrentSlideIndex(nextIndex);
    }
    pendingPresentationSlideActionRef.current = null;
  }, [currentPresentationId, setStatusText, showContentLayer, slides.length]);

  const currentSlide = slides[currentSlideIndex] ?? null;
  const liveSlide = slides[liveSlideIndex] ?? null;

  const liveElements = useMemo(() => {
    if (!activeBundle || !liveSlide) return [];
    return sortElements(activeBundle.slideElements.filter((el) => el.slideId === liveSlide.id));
  }, [activeBundle, liveSlide]);

  const slideElementsById = useMemo(() => {
    const bySlide = new Map<Id, SlideElement[]>();
    for (const slide of slides) bySlide.set(slide.id, []);
    if (!activeBundle) return bySlide;
    for (const el of activeBundle.slideElements) {
      if (!bySlide.has(el.slideId)) continue;
      bySlide.get(el.slideId)!.push(el);
    }
    bySlide.forEach((elements, slideId) => bySlide.set(slideId, sortElements(elements)));
    return bySlide;
  }, [activeBundle, slides]);

  const activateSlide = useCallback((index: number) => {
    if (slides.length === 0) return;
    const next = clamp(index, 0, slides.length - 1);
    setCurrentSlideIndex(next);
    setLiveSlideIndex(next);
    showContentLayer();
    setStatusText(`Live slide ${next + 1}`);
  }, [slides.length, showContentLayer, setStatusText]);

  const takeSlide = useCallback(() => {
    if (slides.length === 0) return;
    setLiveSlideIndex(currentSlideIndex);
    showContentLayer();
    setStatusText(`Taken slide ${currentSlideIndex + 1}`);
  }, [slides.length, currentSlideIndex, showContentLayer, setStatusText]);

  const goNext = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex + 1);
  }, [slides.length, currentSlideIndex, activateSlide]);

  const goPrev = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex - 1);
  }, [slides.length, currentSlideIndex, activateSlide]);

  const createSlideAction = useCallback(async () => {
    if (!currentPresentationId) return;
    const previousSlideIds = new Set(slides.map((slide) => slide.id));
    const nextSnapshot = await mutate(() => window.castApi.createSlide({ presentationId: currentPresentationId }));
    const createdSlideIndex = findCreatedSlideIndex(nextSnapshot, currentPresentationId, previousSlideIds);
    if (createdSlideIndex !== null) setCurrentSlideIndex(createdSlideIndex);
    setStatusText('Created slide');
  }, [currentPresentationId, mutate, setStatusText, slides]);

  const updateCurrentSlideNotes = useCallback(async (notes: string) => {
    if (!currentSlide) return;
    await mutate(() => window.castApi.updateSlideNotes({ slideId: currentSlide.id, notes }));
    setStatusText('Saved slide notes');
  }, [currentSlide, mutate, setStatusText]);

  const focusPresentationSlide = useCallback((presentationId: Id, index: number) => {
    if (!activeBundle) return;
    const presentationSlides = sortSlides(activeBundle.slides.filter((slide) => slide.presentationId === presentationId));
    if (presentationSlides.length === 0) return;
    const nextIndex = clamp(index, 0, presentationSlides.length - 1);
    if (presentationId === currentPresentationId) {
      setCurrentSlideIndex(nextIndex);
      return;
    }

    pendingPresentationSlideActionRef.current = { presentationId, index: nextIndex, action: 'focus' };
    openPresentation(presentationId);
  }, [activeBundle, currentPresentationId, openPresentation]);

  const activatePresentationSlide = useCallback((presentationId: Id, index: number) => {
    if (!activeBundle) return;
    const presentationSlides = sortSlides(activeBundle.slides.filter((slide) => slide.presentationId === presentationId));
    if (presentationSlides.length === 0) return;
    const nextIndex = clamp(index, 0, presentationSlides.length - 1);
    if (presentationId === currentPresentationId) {
      setCurrentSlideIndex(nextIndex);
      setLiveSlideIndex(nextIndex);
      showContentLayer();
      setStatusText(`Live slide ${nextIndex + 1}`);
      return;
    }

    pendingPresentationSlideActionRef.current = { presentationId, index: nextIndex, action: 'activate' };
    openPresentation(presentationId);
  }, [activeBundle, currentPresentationId, openPresentation, setStatusText, showContentLayer]);

  const value = useMemo<SlideContextValue>(
    () => ({
      slides, currentSlideIndex, liveSlideIndex, currentSlide, liveSlide,
      liveElements, slideElementsById, setCurrentSlideIndex,
      activateSlide, takeSlide, goNext, goPrev,
      focusPresentationSlide,
      activatePresentationSlide,
      createSlide: createSlideAction,
      updateCurrentSlideNotes,
    }),
    [slides, currentSlideIndex, liveSlideIndex, currentSlide, liveSlide,
     liveElements, slideElementsById, activateSlide, takeSlide, goNext, goPrev, focusPresentationSlide, activatePresentationSlide, createSlideAction, updateCurrentSlideNotes],
  );

  return <SlideContext.Provider value={value}>{children}</SlideContext.Provider>;
}

export function useSlides(): SlideContextValue {
  const ctx = useContext(SlideContext);
  if (!ctx) throw new Error('useSlides must be used within SlideProvider');
  return ctx;
}

export function findCreatedSlideIndex(snapshot: AppSnapshot, presentationId: Id, previousSlideIds: Set<Id>): number | null {
  for (const bundle of snapshot.bundles) {
    const presentationSlides = sortSlides(bundle.slides.filter((slide) => slide.presentationId === presentationId));
    if (presentationSlides.length === 0) continue;
    const createdIndex = presentationSlides.findIndex((slide) => !previousSlideIds.has(slide.id));
    if (createdIndex !== -1) return createdIndex;
  }
  return null;
}

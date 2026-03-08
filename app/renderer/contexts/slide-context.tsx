import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { AppSnapshot, Id, Slide, SlideElement } from '@core/types';
import { sortSlides, clamp } from '../utils/slides';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
import { usePresentationLayers } from './presentation-layer-context';
import { useProjectContent } from './use-project-content';

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
  const {
    currentPresentationId,
    currentPlaylistPresentationId,
    isDetachedPresentationBrowser,
    openPresentation,
  } = useNavigation();
  const { showContentLayer } = usePresentationLayers();
  const { slidesByPresentationId, slideElementsBySlideId } = useProjectContent();

  const [selectedSlideIndices, setSelectedSlideIndices] = useState<Record<Id, number>>({});
  const [liveSlideIndices, setLiveSlideIndices] = useState<Record<Id, number>>({});

  const slides = useMemo(() => {
    if (!currentPresentationId) return [];
    return slidesByPresentationId.get(currentPresentationId) ?? [];
  }, [currentPresentationId, slidesByPresentationId]);

  const playlistSlides = useMemo(() => {
    if (!currentPlaylistPresentationId) return [];
    return slidesByPresentationId.get(currentPlaylistPresentationId) ?? [];
  }, [currentPlaylistPresentationId, slidesByPresentationId]);

  const currentSlideIndex = useMemo(
    () => resolveSlideIndex(currentPresentationId, selectedSlideIndices, slides.length),
    [currentPresentationId, selectedSlideIndices, slides.length],
  );

  const liveSlideIndex = useMemo(
    () => resolveSlideIndex(currentPlaylistPresentationId, liveSlideIndices, playlistSlides.length),
    [currentPlaylistPresentationId, liveSlideIndices, playlistSlides.length],
  );

  const currentSlide = slides[currentSlideIndex] ?? null;
  const liveSlide = playlistSlides[liveSlideIndex] ?? null;

  const liveElements = useMemo(() => {
    if (!liveSlide) return [];
    return slideElementsBySlideId.get(liveSlide.id) ?? [];
  }, [liveSlide, slideElementsBySlideId]);

  const slideElementsById = useMemo(() => {
    const bySlide = new Map<Id, SlideElement[]>();
    for (const slide of slides) {
      bySlide.set(slide.id, slideElementsBySlideId.get(slide.id) ?? []);
    }
    return bySlide;
  }, [slideElementsBySlideId, slides]);

  const updateSelectedSlideIndex = useCallback((presentationId: Id, nextIndex: number) => {
    setSelectedSlideIndices((current) => ({
      ...current,
      [presentationId]: nextIndex,
    }));
  }, []);

  const updateLiveSlideIndex = useCallback((presentationId: Id, nextIndex: number) => {
    setLiveSlideIndices((current) => ({
      ...current,
      [presentationId]: nextIndex,
    }));
  }, []);

  const setCurrentSlideIndex = useCallback((index: number) => {
    if (!currentPresentationId || slides.length === 0) return;
    updateSelectedSlideIndex(currentPresentationId, clamp(index, 0, slides.length - 1));
  }, [currentPresentationId, slides.length, updateSelectedSlideIndex]);

  const canControlOutput = Boolean(
    currentPresentationId
    && currentPlaylistPresentationId
    && currentPresentationId === currentPlaylistPresentationId
    && !isDetachedPresentationBrowser,
  );

  const activateSlide = useCallback((index: number) => {
    if (!currentPresentationId || slides.length === 0) return;
    const next = clamp(index, 0, slides.length - 1);
    updateSelectedSlideIndex(currentPresentationId, next);
    if (!canControlOutput || !currentPlaylistPresentationId) return;
    updateLiveSlideIndex(currentPlaylistPresentationId, next);
    showContentLayer();
    setStatusText(`Live slide ${next + 1}`);
  }, [
    canControlOutput,
    currentPlaylistPresentationId,
    currentPresentationId,
    setStatusText,
    showContentLayer,
    slides.length,
    updateLiveSlideIndex,
    updateSelectedSlideIndex,
  ]);

  const takeSlide = useCallback(() => {
    if (!canControlOutput || !currentPlaylistPresentationId || slides.length === 0) return;
    updateLiveSlideIndex(currentPlaylistPresentationId, currentSlideIndex);
    showContentLayer();
    setStatusText(`Taken slide ${currentSlideIndex + 1}`);
  }, [
    canControlOutput,
    currentPlaylistPresentationId,
    currentSlideIndex,
    setStatusText,
    showContentLayer,
    slides.length,
    updateLiveSlideIndex,
  ]);

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
    if (createdSlideIndex !== null) updateSelectedSlideIndex(currentPresentationId, createdSlideIndex);
    setStatusText('Created slide');
  }, [currentPresentationId, mutate, setStatusText, slides, updateSelectedSlideIndex]);

  const updateCurrentSlideNotes = useCallback(async (notes: string) => {
    if (!currentSlide) return;
    await mutate(() => window.castApi.updateSlideNotes({ slideId: currentSlide.id, notes }));
    setStatusText('Saved slide notes');
  }, [currentSlide, mutate, setStatusText]);

  const focusPresentationSlide = useCallback((presentationId: Id, index: number) => {
    const presentationSlides = slidesByPresentationId.get(presentationId) ?? [];
    if (presentationSlides.length === 0) return;
    const nextIndex = clamp(index, 0, presentationSlides.length - 1);
    updateSelectedSlideIndex(presentationId, nextIndex);
    openPresentation(presentationId);
  }, [openPresentation, slidesByPresentationId, updateSelectedSlideIndex]);

  const activatePresentationSlide = useCallback((presentationId: Id, index: number) => {
    const presentationSlides = slidesByPresentationId.get(presentationId) ?? [];
    if (presentationSlides.length === 0) return;
    const nextIndex = clamp(index, 0, presentationSlides.length - 1);
    updateSelectedSlideIndex(presentationId, nextIndex);
    updateLiveSlideIndex(presentationId, nextIndex);
    openPresentation(presentationId);
    showContentLayer();
    setStatusText(`Live slide ${nextIndex + 1}`);
  }, [openPresentation, setStatusText, showContentLayer, slidesByPresentationId, updateLiveSlideIndex, updateSelectedSlideIndex]);

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
  const presentationSlides = sortSlides(snapshot.slides.filter((slide) => slide.presentationId === presentationId));
  const createdIndex = presentationSlides.findIndex((slide) => !previousSlideIds.has(slide.id));
  return createdIndex === -1 ? null : createdIndex;
}

function resolveSlideIndex(presentationId: Id | null, indicesByPresentationId: Record<Id, number>, slideCount: number): number {
  if (!presentationId || slideCount <= 0) return 0;
  const rawIndex = indicesByPresentationId[presentationId] ?? 0;
  return clamp(rawIndex, 0, slideCount - 1);
}

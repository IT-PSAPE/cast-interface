import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppSnapshot, Id, Slide, SlideElement } from '@core/types';
import { clamp, sortSlides } from '../utils/slides';
import { useCast } from './cast-context';
import { useNavigation } from './navigation-context';
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
  clearCurrentSlideSelection: () => void;
  activateSlide: (idx: number) => void;
  armCurrentPlaylistSelection: () => void;
  takeSlide: () => void;
  goNext: () => void;
  goPrev: () => void;
  selectPlaylistPresentation: (presentationId: Id) => void;
  focusPresentationSlide: (presentationId: Id, index: number) => void;
  activatePresentationSlide: (presentationId: Id, index: number) => void;
  createSlide: () => Promise<void>;
  updateCurrentSlideNotes: (notes: string) => Promise<void>;
}

const SlideContext = createContext<SlideContextValue | null>(null);
const NO_SLIDE_SELECTED = -1;

export function SlideProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const {
    currentPresentationId,
    currentPlaylistPresentationId,
    currentOutputPresentationId,
    isDetachedPresentationBrowser,
    armOutputPresentation,
    selectPlaylistPresentation: selectPlaylistPresentationInNavigation,
  } = useNavigation();
  const { slidesByPresentationId, slideElementsBySlideId } = useProjectContent();

  const [playlistSelectedSlideIndices, setPlaylistSelectedSlideIndices] = useState<Record<Id, number>>({});
  const [drawerSelectedSlideIndices, setDrawerSelectedSlideIndices] = useState<Record<Id, number>>({});
  const [liveSlideIndices, setLiveSlideIndices] = useState<Record<Id, number>>({});

  const slides = useMemo(() => {
    if (!currentPresentationId) return [];
    return slidesByPresentationId.get(currentPresentationId) ?? [];
  }, [currentPresentationId, slidesByPresentationId]);

  const outputSlides = useMemo(() => {
    if (!currentOutputPresentationId) return [];
    return slidesByPresentationId.get(currentOutputPresentationId) ?? [];
  }, [currentOutputPresentationId, slidesByPresentationId]);

  const currentSlideIndex = useMemo(() => {
    const indicesByPresentationId = isDetachedPresentationBrowser
      ? drawerSelectedSlideIndices
      : playlistSelectedSlideIndices;
    return resolveSlideIndex(currentPresentationId, indicesByPresentationId, slides.length);
  }, [
    currentPresentationId,
    drawerSelectedSlideIndices,
    isDetachedPresentationBrowser,
    playlistSelectedSlideIndices,
    slides.length,
  ]);

  const liveSlideIndex = useMemo(
    () => resolveSlideIndex(currentOutputPresentationId, liveSlideIndices, outputSlides.length),
    [currentOutputPresentationId, liveSlideIndices, outputSlides.length],
  );

  const currentSlide = slides[currentSlideIndex] ?? null;
  const liveSlide = outputSlides[liveSlideIndex] ?? null;

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

  const updatePlaylistSelectedSlideIndex = useCallback((presentationId: Id, nextIndex: number) => {
    setPlaylistSelectedSlideIndices((current) => ({
      ...current,
      [presentationId]: nextIndex,
    }));
  }, []);

  const updateDrawerSelectedSlideIndex = useCallback((presentationId: Id, nextIndex: number) => {
    setDrawerSelectedSlideIndices((current) => ({
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

  const updateVisibleSelectedSlideIndex = useCallback((presentationId: Id, nextIndex: number) => {
    if (isDetachedPresentationBrowser) {
      updateDrawerSelectedSlideIndex(presentationId, nextIndex);
      return;
    }
    updatePlaylistSelectedSlideIndex(presentationId, nextIndex);
  }, [isDetachedPresentationBrowser, updateDrawerSelectedSlideIndex, updatePlaylistSelectedSlideIndex]);

  const activatePlaylistPresentation = useCallback((presentationId: Id, nextIndex: number | null) => {
    selectPlaylistPresentationInNavigation(presentationId);
    if (nextIndex !== null) {
      updateLiveSlideIndex(presentationId, nextIndex);
    }
    armOutputPresentation(presentationId);
  }, [armOutputPresentation, selectPlaylistPresentationInNavigation, updateLiveSlideIndex]);

  const selectPlaylistPresentation = useCallback((presentationId: Id) => {
    selectPlaylistPresentationInNavigation(presentationId);
  }, [selectPlaylistPresentationInNavigation]);

  const setCurrentSlideIndex = useCallback((index: number) => {
    if (!currentPresentationId || slides.length === 0) return;
    updateVisibleSelectedSlideIndex(currentPresentationId, clamp(index, 0, slides.length - 1));
  }, [currentPresentationId, slides.length, updateVisibleSelectedSlideIndex]);

  const clearCurrentSlideSelection = useCallback(() => {
    if (!currentPresentationId) return;
    updateVisibleSelectedSlideIndex(currentPresentationId, NO_SLIDE_SELECTED);
  }, [currentPresentationId, updateVisibleSelectedSlideIndex]);

  const canControlOutput = Boolean(
    currentPresentationId
    && currentPlaylistPresentationId
    && currentPresentationId === currentPlaylistPresentationId
    && !isDetachedPresentationBrowser,
  );

  const activateSlide = useCallback((index: number) => {
    if (!currentPresentationId || slides.length === 0) return;
    const nextIndex = clamp(index, 0, slides.length - 1);
    updateVisibleSelectedSlideIndex(currentPresentationId, nextIndex);
    if (!canControlOutput || !currentPlaylistPresentationId) return;
    updateLiveSlideIndex(currentPlaylistPresentationId, nextIndex);
    armOutputPresentation(currentPlaylistPresentationId);
    setStatusText(`Live slide ${nextIndex + 1}`);
  }, [
    armOutputPresentation,
    canControlOutput,
    currentPlaylistPresentationId,
    currentPresentationId,
    setStatusText,
    slides.length,
    updateLiveSlideIndex,
    updateVisibleSelectedSlideIndex,
  ]);

  const takeSlide = useCallback(() => {
    if (!canControlOutput || !currentPlaylistPresentationId || slides.length === 0 || currentSlideIndex < 0) return;
    updateLiveSlideIndex(currentPlaylistPresentationId, currentSlideIndex);
    armOutputPresentation(currentPlaylistPresentationId);
    setStatusText(`Taken slide ${currentSlideIndex + 1}`);
  }, [
    armOutputPresentation,
    canControlOutput,
    currentPlaylistPresentationId,
    currentSlideIndex,
    setStatusText,
    slides.length,
    updateLiveSlideIndex,
  ]);

  const armCurrentPlaylistSelection = useCallback(() => {
    if (!currentPlaylistPresentationId) return;
    const presentationSlides = slidesByPresentationId.get(currentPlaylistPresentationId) ?? [];
    const nextIndex = resolveSlideIndex(currentPlaylistPresentationId, playlistSelectedSlideIndices, presentationSlides.length);
    if (presentationSlides.length > 0) {
      updateLiveSlideIndex(currentPlaylistPresentationId, nextIndex);
    }
    armOutputPresentation(currentPlaylistPresentationId);
  }, [armOutputPresentation, currentPlaylistPresentationId, playlistSelectedSlideIndices, slidesByPresentationId, updateLiveSlideIndex]);

  const goNext = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex + 1);
  }, [activateSlide, currentSlideIndex, slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex - 1);
  }, [activateSlide, currentSlideIndex, slides.length]);

  const createSlideAction = useCallback(async () => {
    if (!currentPresentationId) return;
    const previousSlideIds = new Set(slides.map((slide) => slide.id));
    const nextSnapshot = await mutate(() => window.castApi.createSlide({ presentationId: currentPresentationId }));
    const createdSlideIndex = findCreatedSlideIndex(nextSnapshot, currentPresentationId, previousSlideIds);
    if (createdSlideIndex !== null) updateVisibleSelectedSlideIndex(currentPresentationId, createdSlideIndex);
    setStatusText('Created slide');
  }, [currentPresentationId, mutate, setStatusText, slides, updateVisibleSelectedSlideIndex]);

  const updateCurrentSlideNotes = useCallback(async (notes: string) => {
    if (!currentSlide) return;
    await mutate(() => window.castApi.updateSlideNotes({ slideId: currentSlide.id, notes }));
    setStatusText('Saved slide notes');
  }, [currentSlide, mutate, setStatusText]);

  const focusPresentationSlide = useCallback((presentationId: Id, index: number) => {
    const presentationSlides = slidesByPresentationId.get(presentationId) ?? [];
    if (presentationSlides.length === 0) return;
    const nextIndex = clamp(index, 0, presentationSlides.length - 1);
    updatePlaylistSelectedSlideIndex(presentationId, nextIndex);
    selectPlaylistPresentationInNavigation(presentationId);
  }, [selectPlaylistPresentationInNavigation, slidesByPresentationId, updatePlaylistSelectedSlideIndex]);

  const activatePresentationSlide = useCallback((presentationId: Id, index: number) => {
    const presentationSlides = slidesByPresentationId.get(presentationId) ?? [];
    if (presentationSlides.length === 0) return;
    const nextIndex = clamp(index, 0, presentationSlides.length - 1);
    updatePlaylistSelectedSlideIndex(presentationId, nextIndex);
    activatePlaylistPresentation(presentationId, nextIndex);
    setStatusText(`Live slide ${nextIndex + 1}`);
  }, [activatePlaylistPresentation, setStatusText, slidesByPresentationId, updatePlaylistSelectedSlideIndex]);

  const value = useMemo<SlideContextValue>(() => ({
    slides,
    currentSlideIndex,
    liveSlideIndex,
    currentSlide,
    liveSlide,
    liveElements,
    slideElementsById,
    setCurrentSlideIndex,
    clearCurrentSlideSelection,
    activateSlide,
    armCurrentPlaylistSelection,
    takeSlide,
    goNext,
    goPrev,
    selectPlaylistPresentation,
    focusPresentationSlide,
    activatePresentationSlide,
    createSlide: createSlideAction,
    updateCurrentSlideNotes,
  }), [
    activatePresentationSlide,
    activateSlide,
    armCurrentPlaylistSelection,
    createSlideAction,
    currentSlide,
    currentSlideIndex,
    clearCurrentSlideSelection,
    focusPresentationSlide,
    goNext,
    goPrev,
    liveElements,
    liveSlide,
    liveSlideIndex,
    selectPlaylistPresentation,
    setCurrentSlideIndex,
    slideElementsById,
    slides,
    takeSlide,
    updateCurrentSlideNotes,
  ]);

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
  if (!presentationId || slideCount <= 0) return NO_SLIDE_SELECTED;
  const rawIndex = indicesByPresentationId[presentationId];
  if (rawIndex === NO_SLIDE_SELECTED) return NO_SLIDE_SELECTED;
  if (rawIndex == null) return 0;
  return clamp(rawIndex, 0, slideCount - 1);
}

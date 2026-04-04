import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getSlideContentItemId } from '@core/content-items';
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
  selectPlaylistContentItem: (itemId: Id) => void;
  focusContentItemSlide: (itemId: Id, index: number) => void;
  activateContentItemSlide: (itemId: Id, index: number) => void;
  createSlide: () => Promise<void>;
  deleteSlide: (slideId: Id) => Promise<void>;
  updateCurrentSlideNotes: (notes: string) => Promise<void>;
}

const SlideContext = createContext<SlideContextValue | null>(null);
const NO_SLIDE_SELECTED = -1;

export function SlideProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const {
    currentContentItemId,
    currentPlaylistContentItemId,
    currentOutputContentItemId,
    currentContentItem,
    isDetachedContentBrowser,
    armOutputContentItem,
    selectPlaylistContentItem: selectPlaylistContentItemInNavigation,
  } = useNavigation();
  const { slidesByContentItemId, slideElementsBySlideId } = useProjectContent();

  const [playlistSelectedSlideIndices, setPlaylistSelectedSlideIndices] = useState<Record<Id, number>>({});
  const [drawerSelectedSlideIndices, setDrawerSelectedSlideIndices] = useState<Record<Id, number>>({});
  const [liveSlideIndices, setLiveSlideIndices] = useState<Record<Id, number>>({});

  const slides = useMemo(() => {
    if (!currentContentItemId) return [];
    return slidesByContentItemId.get(currentContentItemId) ?? [];
  }, [currentContentItemId, slidesByContentItemId]);

  const outputSlides = useMemo(() => {
    if (!currentOutputContentItemId) return [];
    return slidesByContentItemId.get(currentOutputContentItemId) ?? [];
  }, [currentOutputContentItemId, slidesByContentItemId]);

  const currentSlideIndex = useMemo(() => {
    const indicesByContentItemId = isDetachedContentBrowser
      ? drawerSelectedSlideIndices
      : playlistSelectedSlideIndices;
    return resolveSlideIndex(currentContentItemId, indicesByContentItemId, slides.length);
  }, [
    currentContentItemId,
    drawerSelectedSlideIndices,
    isDetachedContentBrowser,
    playlistSelectedSlideIndices,
    slides.length,
  ]);

  const liveSlideIndex = useMemo(
    () => resolveSlideIndex(currentOutputContentItemId, liveSlideIndices, outputSlides.length),
    [currentOutputContentItemId, liveSlideIndices, outputSlides.length],
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

  const updatePlaylistSelectedSlideIndex = useCallback((itemId: Id, nextIndex: number) => {
    setPlaylistSelectedSlideIndices((current) => ({
      ...current,
      [itemId]: nextIndex,
    }));
  }, []);

  const updateDrawerSelectedSlideIndex = useCallback((itemId: Id, nextIndex: number) => {
    setDrawerSelectedSlideIndices((current) => ({
      ...current,
      [itemId]: nextIndex,
    }));
  }, []);

  const updateLiveSlideIndex = useCallback((itemId: Id, nextIndex: number) => {
    setLiveSlideIndices((current) => ({
      ...current,
      [itemId]: nextIndex,
    }));
  }, []);

  const updateVisibleSelectedSlideIndex = useCallback((itemId: Id, nextIndex: number) => {
    if (isDetachedContentBrowser) {
      updateDrawerSelectedSlideIndex(itemId, nextIndex);
      return;
    }
    updatePlaylistSelectedSlideIndex(itemId, nextIndex);
  }, [isDetachedContentBrowser, updateDrawerSelectedSlideIndex, updatePlaylistSelectedSlideIndex]);

  const activatePlaylistContentItem = useCallback((itemId: Id, nextIndex: number | null) => {
    selectPlaylistContentItemInNavigation(itemId);
    if (nextIndex !== null) {
      updateLiveSlideIndex(itemId, nextIndex);
    }
    armOutputContentItem(itemId);
  }, [armOutputContentItem, selectPlaylistContentItemInNavigation, updateLiveSlideIndex]);

  const selectPlaylistContentItem = useCallback((itemId: Id) => {
    selectPlaylistContentItemInNavigation(itemId);
  }, [selectPlaylistContentItemInNavigation]);

  const setCurrentSlideIndex = useCallback((index: number) => {
    if (!currentContentItemId || slides.length === 0) return;
    updateVisibleSelectedSlideIndex(currentContentItemId, clamp(index, 0, slides.length - 1));
  }, [currentContentItemId, slides.length, updateVisibleSelectedSlideIndex]);

  const clearCurrentSlideSelection = useCallback(() => {
    if (!currentContentItemId) return;
    updateVisibleSelectedSlideIndex(currentContentItemId, NO_SLIDE_SELECTED);
  }, [currentContentItemId, updateVisibleSelectedSlideIndex]);

  const canControlOutput = Boolean(
    currentContentItemId
    && currentPlaylistContentItemId
    && currentContentItemId === currentPlaylistContentItemId
    && !isDetachedContentBrowser,
  );

  const activateSlide = useCallback((index: number) => {
    if (!currentContentItemId || slides.length === 0) return;
    const nextIndex = clamp(index, 0, slides.length - 1);
    updateVisibleSelectedSlideIndex(currentContentItemId, nextIndex);
    if (!canControlOutput || !currentPlaylistContentItemId) return;
    updateLiveSlideIndex(currentPlaylistContentItemId, nextIndex);
    armOutputContentItem(currentPlaylistContentItemId);
    setStatusText(`Live slide ${nextIndex + 1}`);
  }, [
    armOutputContentItem,
    canControlOutput,
    currentPlaylistContentItemId,
    currentContentItemId,
    setStatusText,
    slides.length,
    updateLiveSlideIndex,
    updateVisibleSelectedSlideIndex,
  ]);

  const takeSlide = useCallback(() => {
    if (!canControlOutput || !currentPlaylistContentItemId || slides.length === 0 || currentSlideIndex < 0) return;
    updateLiveSlideIndex(currentPlaylistContentItemId, currentSlideIndex);
    armOutputContentItem(currentPlaylistContentItemId);
    setStatusText(`Taken slide ${currentSlideIndex + 1}`);
  }, [
    armOutputContentItem,
    canControlOutput,
    currentPlaylistContentItemId,
    currentSlideIndex,
    setStatusText,
    slides.length,
    updateLiveSlideIndex,
  ]);

  const armCurrentPlaylistSelection = useCallback(() => {
    if (!currentPlaylistContentItemId) return;
    const contentSlides = slidesByContentItemId.get(currentPlaylistContentItemId) ?? [];
    const nextIndex = resolveSlideIndex(currentPlaylistContentItemId, playlistSelectedSlideIndices, contentSlides.length);
    if (contentSlides.length > 0) {
      updateLiveSlideIndex(currentPlaylistContentItemId, nextIndex);
    }
    armOutputContentItem(currentPlaylistContentItemId);
  }, [armOutputContentItem, currentPlaylistContentItemId, playlistSelectedSlideIndices, slidesByContentItemId, updateLiveSlideIndex]);

  const goNext = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex + 1);
  }, [activateSlide, currentSlideIndex, slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex - 1);
  }, [activateSlide, currentSlideIndex, slides.length]);

  const createSlideAction = useCallback(async () => {
    if (!currentContentItemId || !currentContentItem) return;
    const previousSlideIds = new Set(slides.map((slide) => slide.id));
    const nextSnapshot = await mutate(() => window.castApi.createSlide({
      deckId: currentContentItem.type === 'deck' ? currentContentItemId : null,
      lyricId: currentContentItem.type === 'lyric' ? currentContentItemId : null,
    }));
    const createdSlideIndex = findCreatedSlideIndex(nextSnapshot, currentContentItemId, previousSlideIds);
    if (createdSlideIndex !== null) updateVisibleSelectedSlideIndex(currentContentItemId, createdSlideIndex);
    setStatusText('Created slide');
  }, [currentContentItem, currentContentItemId, mutate, setStatusText, slides, updateVisibleSelectedSlideIndex]);

  const deleteSlideAction = useCallback(async (slideId: Id) => {
    if (!currentContentItemId) return;
    const deletedIndex = slides.findIndex((slide) => slide.id === slideId);
    await mutate(() => window.castApi.deleteSlide(slideId));
    if (deletedIndex >= 0 && slides.length > 1) {
      const nextIndex = clamp(deletedIndex >= slides.length - 1 ? deletedIndex - 1 : deletedIndex, 0, slides.length - 2);
      updateVisibleSelectedSlideIndex(currentContentItemId, nextIndex);
    }
    setStatusText('Deleted slide');
  }, [currentContentItemId, mutate, setStatusText, slides, updateVisibleSelectedSlideIndex]);

  const updateCurrentSlideNotes = useCallback(async (notes: string) => {
    if (!currentSlide) return;
    await mutate(() => window.castApi.updateSlideNotes({ slideId: currentSlide.id, notes }));
    setStatusText('Saved slide notes');
  }, [currentSlide, mutate, setStatusText]);

  const focusContentItemSlide = useCallback((itemId: Id, index: number) => {
    const contentSlides = slidesByContentItemId.get(itemId) ?? [];
    if (contentSlides.length === 0) return;
    const nextIndex = clamp(index, 0, contentSlides.length - 1);
    updatePlaylistSelectedSlideIndex(itemId, nextIndex);
    selectPlaylistContentItemInNavigation(itemId);
  }, [selectPlaylistContentItemInNavigation, slidesByContentItemId, updatePlaylistSelectedSlideIndex]);

  const activateContentItemSlide = useCallback((itemId: Id, index: number) => {
    const contentSlides = slidesByContentItemId.get(itemId) ?? [];
    if (contentSlides.length === 0) return;
    const nextIndex = clamp(index, 0, contentSlides.length - 1);
    updatePlaylistSelectedSlideIndex(itemId, nextIndex);
    activatePlaylistContentItem(itemId, nextIndex);
    setStatusText(`Live slide ${nextIndex + 1}`);
  }, [activatePlaylistContentItem, setStatusText, slidesByContentItemId, updatePlaylistSelectedSlideIndex]);

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
    selectPlaylistContentItem,
    focusContentItemSlide,
    activateContentItemSlide,
    createSlide: createSlideAction,
    deleteSlide: deleteSlideAction,
    updateCurrentSlideNotes,
  }), [
    activateContentItemSlide,
    activateSlide,
    armCurrentPlaylistSelection,
    createSlideAction,
    deleteSlideAction,
    currentSlide,
    currentSlideIndex,
    clearCurrentSlideSelection,
    focusContentItemSlide,
    goNext,
    goPrev,
    liveElements,
    liveSlide,
    liveSlideIndex,
    selectPlaylistContentItem,
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

export function findCreatedSlideIndex(snapshot: AppSnapshot, itemId: Id, previousSlideIds: Set<Id>): number | null {
  const contentSlides = sortSlides(snapshot.slides.filter((slide) => getSlideContentItemId(slide) === itemId));
  const createdIndex = contentSlides.findIndex((slide) => !previousSlideIds.has(slide.id));
  return createdIndex === -1 ? null : createdIndex;
}

function resolveSlideIndex(itemId: Id | null, indicesByItemId: Record<Id, number>, slideCount: number): number {
  if (!itemId || slideCount <= 0) return NO_SLIDE_SELECTED;
  const rawIndex = indicesByItemId[itemId];
  if (rawIndex === NO_SLIDE_SELECTED) return NO_SLIDE_SELECTED;
  if (rawIndex == null) return 0;
  return clamp(rawIndex, 0, slideCount - 1);
}

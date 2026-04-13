import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { getSlideDeckItemId } from '@core/deck-items';
import type { AppSnapshot, Id, Slide, SlideElement } from '@core/types';
import { clamp, sortSlides } from '../utils/slides';
import { useIndexedSelection } from '../hooks/use-indexed-selection';
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
  selectPlaylistDeckItem: (itemId: Id) => void;
  focusDeckItemSlide: (itemId: Id, index: number) => void;
  activateDeckItemSlide: (itemId: Id, index: number) => void;
  createSlide: () => Promise<void>;
  deleteSlide: (slideId: Id) => Promise<void>;
  updateCurrentSlideNotes: (notes: string) => Promise<void>;
}

const SlideContext = createContext<SlideContextValue | null>(null);
const NO_SLIDE_SELECTED = -1;

export function SlideProvider({ children }: { children: ReactNode }) {
  const { mutate, runOperation, setStatusText } = useCast();
  const {
    currentDeckItemId,
    currentPlaylistDeckItemId,
    currentOutputDeckItemId,
    currentDeckItem,
    isDetachedDeckBrowser,
    armOutputDeckItem,
    selectPlaylistDeckItem: selectPlaylistDeckItemInNavigation,
  } = useNavigation();
  const { slidesByDeckItemId, slideElementsBySlideId } = useProjectContent();

  const playlistSelection = useIndexedSelection();
  const drawerSelection = useIndexedSelection();
  const liveSelection = useIndexedSelection();

  const slides = useMemo(() => {
    if (!currentDeckItemId) return [];
    return slidesByDeckItemId.get(currentDeckItemId) ?? [];
  }, [currentDeckItemId, slidesByDeckItemId]);

  const outputSlides = useMemo(() => {
    if (!currentOutputDeckItemId) return [];
    return slidesByDeckItemId.get(currentOutputDeckItemId) ?? [];
  }, [currentOutputDeckItemId, slidesByDeckItemId]);

  const currentSlideIndex = useMemo(() => {
    const indicesByDeckItemId = isDetachedDeckBrowser
      ? drawerSelection.indices
      : playlistSelection.indices;
    return resolveSlideIndex(currentDeckItemId, indicesByDeckItemId, slides.length);
  }, [
    currentDeckItemId,
    drawerSelection.indices,
    isDetachedDeckBrowser,
    playlistSelection.indices,
    slides.length,
  ]);

  const liveSlideIndex = useMemo(
    () => resolveSlideIndex(currentOutputDeckItemId, liveSelection.indices, outputSlides.length),
    [currentOutputDeckItemId, liveSelection.indices, outputSlides.length],
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

  const updateVisibleSelectedSlideIndex = useCallback((itemId: Id, nextIndex: number) => {
    if (isDetachedDeckBrowser) {
      drawerSelection.update(itemId, nextIndex);
      return;
    }
    playlistSelection.update(itemId, nextIndex);
  }, [isDetachedDeckBrowser, drawerSelection, playlistSelection]);

  const activatePlaylistDeckItem = useCallback((itemId: Id, nextIndex: number | null) => {
    selectPlaylistDeckItemInNavigation(itemId);
    if (nextIndex !== null) {
      liveSelection.update(itemId, nextIndex);
    }
    armOutputDeckItem(itemId);
  }, [armOutputDeckItem, selectPlaylistDeckItemInNavigation, liveSelection.update]);

  const selectPlaylistDeckItem = useCallback((itemId: Id) => {
    selectPlaylistDeckItemInNavigation(itemId);
  }, [selectPlaylistDeckItemInNavigation]);

  const setCurrentSlideIndex = useCallback((index: number) => {
    if (!currentDeckItemId || slides.length === 0) return;
    updateVisibleSelectedSlideIndex(currentDeckItemId, clamp(index, 0, slides.length - 1));
  }, [currentDeckItemId, slides.length, updateVisibleSelectedSlideIndex]);

  const clearCurrentSlideSelection = useCallback(() => {
    if (!currentDeckItemId) return;
    updateVisibleSelectedSlideIndex(currentDeckItemId, NO_SLIDE_SELECTED);
  }, [currentDeckItemId, updateVisibleSelectedSlideIndex]);

  const canControlOutput = Boolean(
    currentDeckItemId
    && currentPlaylistDeckItemId
    && currentDeckItemId === currentPlaylistDeckItemId
    && !isDetachedDeckBrowser,
  );

  const activateSlide = useCallback((index: number) => {
    if (!currentDeckItemId || slides.length === 0) return;
    const nextIndex = clamp(index, 0, slides.length - 1);
    updateVisibleSelectedSlideIndex(currentDeckItemId, nextIndex);
    if (!canControlOutput || !currentPlaylistDeckItemId) return;
    liveSelection.update(currentPlaylistDeckItemId, nextIndex);
    armOutputDeckItem(currentPlaylistDeckItemId);
    setStatusText(`Live slide ${nextIndex + 1}`);
  }, [
    armOutputDeckItem,
    canControlOutput,
    currentPlaylistDeckItemId,
    currentDeckItemId,
    setStatusText,
    slides.length,
    liveSelection.update,
    updateVisibleSelectedSlideIndex,
  ]);

  const takeSlide = useCallback(() => {
    if (!canControlOutput || !currentPlaylistDeckItemId || slides.length === 0 || currentSlideIndex < 0) return;
    liveSelection.update(currentPlaylistDeckItemId, currentSlideIndex);
    armOutputDeckItem(currentPlaylistDeckItemId);
    setStatusText(`Taken slide ${currentSlideIndex + 1}`);
  }, [
    armOutputDeckItem,
    canControlOutput,
    currentPlaylistDeckItemId,
    currentSlideIndex,
    setStatusText,
    slides.length,
    liveSelection.update,
  ]);

  const armCurrentPlaylistSelection = useCallback(() => {
    if (!currentPlaylistDeckItemId) return;
    const contentSlides = slidesByDeckItemId.get(currentPlaylistDeckItemId) ?? [];
    const nextIndex = resolveSlideIndex(currentPlaylistDeckItemId, playlistSelection.indices, contentSlides.length);
    if (contentSlides.length > 0) {
      liveSelection.update(currentPlaylistDeckItemId, nextIndex);
    }
    armOutputDeckItem(currentPlaylistDeckItemId);
  }, [armOutputDeckItem, currentPlaylistDeckItemId, playlistSelection.indices, slidesByDeckItemId, liveSelection.update]);

  const goNext = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex + 1);
  }, [activateSlide, currentSlideIndex, slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length === 0) return;
    activateSlide(currentSlideIndex - 1);
  }, [activateSlide, currentSlideIndex, slides.length]);

  const createSlideAction = useCallback(async () => {
    if (!currentDeckItemId || !currentDeckItem) return;
    await runOperation('Creating slide...', async () => {
      const previousSlideIds = new Set(slides.map((slide) => slide.id));
      const nextSnapshot = await mutate(() => window.castApi.createSlide({
        presentationId: currentDeckItem.type === 'presentation' ? currentDeckItemId : null,
        lyricId: currentDeckItem.type === 'lyric' ? currentDeckItemId : null,
      }));
      const createdSlideIndex = findCreatedSlideIndex(nextSnapshot, currentDeckItemId, previousSlideIds);
      if (createdSlideIndex !== null) updateVisibleSelectedSlideIndex(currentDeckItemId, createdSlideIndex);
      setStatusText('Created slide');
    });
  }, [currentDeckItem, currentDeckItemId, mutate, runOperation, setStatusText, slides, updateVisibleSelectedSlideIndex]);

  const deleteSlideAction = useCallback(async (slideId: Id) => {
    if (!currentDeckItemId) return;
    const deletedIndex = slides.findIndex((slide) => slide.id === slideId);
    await mutate(() => window.castApi.deleteSlide(slideId));
    if (deletedIndex >= 0 && slides.length > 1) {
      const nextIndex = clamp(deletedIndex >= slides.length - 1 ? deletedIndex - 1 : deletedIndex, 0, slides.length - 2);
      updateVisibleSelectedSlideIndex(currentDeckItemId, nextIndex);
    }
    setStatusText('Deleted slide');
  }, [currentDeckItemId, mutate, setStatusText, slides, updateVisibleSelectedSlideIndex]);

  const updateCurrentSlideNotes = useCallback(async (notes: string) => {
    if (!currentSlide) return;
    await mutate(() => window.castApi.updateSlideNotes({ slideId: currentSlide.id, notes }));
    setStatusText('Saved slide notes');
  }, [currentSlide, mutate, setStatusText]);

  const focusDeckItemSlide = useCallback((itemId: Id, index: number) => {
    const contentSlides = slidesByDeckItemId.get(itemId) ?? [];
    if (contentSlides.length === 0) return;
    const nextIndex = clamp(index, 0, contentSlides.length - 1);
    playlistSelection.update(itemId, nextIndex);
    selectPlaylistDeckItemInNavigation(itemId);
  }, [selectPlaylistDeckItemInNavigation, slidesByDeckItemId, playlistSelection.update]);

  const activateDeckItemSlide = useCallback((itemId: Id, index: number) => {
    const contentSlides = slidesByDeckItemId.get(itemId) ?? [];
    if (contentSlides.length === 0) return;
    const nextIndex = clamp(index, 0, contentSlides.length - 1);
    playlistSelection.update(itemId, nextIndex);
    activatePlaylistDeckItem(itemId, nextIndex);
    setStatusText(`Live slide ${nextIndex + 1}`);
  }, [activatePlaylistDeckItem, setStatusText, slidesByDeckItemId, playlistSelection.update]);

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
    selectPlaylistDeckItem,
    focusDeckItemSlide,
    activateDeckItemSlide,
    createSlide: createSlideAction,
    deleteSlide: deleteSlideAction,
    updateCurrentSlideNotes,
  }), [
    activateDeckItemSlide,
    activateSlide,
    armCurrentPlaylistSelection,
    createSlideAction,
    deleteSlideAction,
    currentSlide,
    currentSlideIndex,
    clearCurrentSlideSelection,
    focusDeckItemSlide,
    goNext,
    goPrev,
    liveElements,
    liveSlide,
    liveSlideIndex,
    selectPlaylistDeckItem,
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
  const contentSlides = sortSlides(snapshot.slides.filter((slide) => getSlideDeckItemId(slide) === itemId));
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

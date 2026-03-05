import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { Id, Slide, SlideElement } from '@core/types';
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
  createSlide: () => Promise<void>;
}

const SlideContext = createContext<SlideContextValue | null>(null);

export function SlideProvider({ children }: { children: ReactNode }) {
  const { mutate, setStatusText } = useCast();
  const { activeBundle, currentPresentationId } = useNavigation();
  const { showContentLayer } = usePresentationLayers();

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
    await mutate(() => window.castApi.createSlide({ presentationId: currentPresentationId }));
    setStatusText('Created slide');
  }, [currentPresentationId, mutate, setStatusText]);

  const value = useMemo<SlideContextValue>(
    () => ({
      slides, currentSlideIndex, liveSlideIndex, currentSlide, liveSlide,
      liveElements, slideElementsById, setCurrentSlideIndex,
      activateSlide, takeSlide, goNext, goPrev, createSlide: createSlideAction,
    }),
    [slides, currentSlideIndex, liveSlideIndex, currentSlide, liveSlide,
     liveElements, slideElementsById, activateSlide, takeSlide, goNext, goPrev, createSlideAction],
  );

  return <SlideContext.Provider value={value}>{children}</SlideContext.Provider>;
}

export function useSlides(): SlideContextValue {
  const ctx = useContext(SlideContext);
  if (!ctx) throw new Error('useSlides must be used within SlideProvider');
  return ctx;
}

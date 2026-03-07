import { useCallback, useMemo } from 'react';
import type { Id, Slide, SlideElement } from '@core/types';
import type { SlideVisualState } from '../../../types/ui';
import { clamp, getSlideVisualState, replacePrimaryLine, slideTextDetails } from '../../../utils/slides';
import { useCast } from '../../../contexts/cast-context';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';

export interface OutlineSlideRow {
  slide: Slide;
  index: number;
  state: SlideVisualState;
  elements: SlideElement[];
  primaryText: string;
  secondaryText: string;
  textElementId: Id | null;
  textEditable: boolean;
}

interface OutlineViewModel {
  rows: OutlineSlideRow[];
  currentSlideIndex: number;
  selectSlide: (index: number) => void;
  openSlide: (index: number) => void;
  updatePrimaryText: (slideId: Id, nextPrimary: string) => void;
}

export function useOutlineView(): OutlineViewModel {
  const { mutate, setStatusText } = useCast();
  const { currentPresentation } = useNavigation();
  const { slides, currentSlideIndex, liveSlideIndex, slideElementsById, setCurrentSlideIndex } = useSlides();
  const { setSlideBrowserMode } = useSlideBrowser();
  const textEditable = currentPresentation?.kind === 'lyrics';

  const rows = useMemo(() => {
    return slides.map((slide, index) => {
      const elements = slideElementsById.get(slide.id) ?? [];
      const details = slideTextDetails(elements);
      const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

      return {
        slide,
        index,
        state,
        elements,
        primaryText: details.primaryLine,
        secondaryText: details.secondaryLine,
        textElementId: details.textElement?.id ?? null,
        textEditable,
      } satisfies OutlineSlideRow;
    });
  }, [slides, slideElementsById, liveSlideIndex, currentSlideIndex, textEditable]);

  const rowBySlideId = useMemo(() => {
    const map = new Map<Id, OutlineSlideRow>();
    for (const row of rows) map.set(row.slide.id, row);
    return map;
  }, [rows]);

  const selectSlide = useCallback((index: number) => {
    if (slides.length === 0) return;
    setCurrentSlideIndex(clamp(index, 0, slides.length - 1));
  }, [slides.length, setCurrentSlideIndex]);

  const openSlide = useCallback((index: number) => {
    if (slides.length === 0) return;
    setCurrentSlideIndex(clamp(index, 0, slides.length - 1));
    setSlideBrowserMode('focus');
  }, [slides.length, setCurrentSlideIndex, setSlideBrowserMode]);

  const updatePrimaryText = useCallback((slideId: Id, nextPrimary: string) => {
    const row = rowBySlideId.get(slideId);
    if (!row || !row.textElementId || !row.textEditable) return;

    const textElement = row.elements.find((element) => element.id === row.textElementId);
    if (!textElement || !('text' in textElement.payload)) return;

    const currentText = String(textElement.payload.text ?? '');
    const nextText = replacePrimaryLine(currentText, nextPrimary);
    if (!nextText.trim() || nextText === currentText) return;

    void mutate(() => window.castApi.updateElement({
      id: textElement.id,
      payload: { ...textElement.payload, text: nextText },
    }));

    setStatusText(`Updated slide ${row.index + 1} text`);
  }, [rowBySlideId, mutate, setStatusText]);

  return { rows, currentSlideIndex, selectSlide, openSlide, updatePrimaryText };
}

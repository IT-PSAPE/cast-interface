import { useCallback } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useSlides } from '../../contexts/slide-context';

export function useContinuousSlideSections() {
  const { currentContentItemId, currentOutputContentItemId } = useNavigation();
  const { currentSlideIndex, liveSlideIndex, activateContentItemSlide, focusContentItemSlide } = useSlides();
  const { slideElementsBySlideId } = useProjectContent();

  const handleActivateSlide = useCallback((itemId: Id, slideIndex: number) => {
    activateContentItemSlide(itemId, slideIndex);
  }, [activateContentItemSlide]);

  const handleEditSlide = useCallback((itemId: Id, slideIndex: number) => {
    focusContentItemSlide(itemId, slideIndex);
  }, [focusContentItemSlide]);

  return {
    currentContentItemId,
    currentOutputContentItemId,
    currentSlideIndex,
    liveSlideIndex,
    slideElementsBySlideId,
    handleActivateSlide,
    handleEditSlide,
  };
}

import { useCallback } from 'react';
import type { Id, SlideElement } from '@core/types';
import { useNavigation } from '../../contexts/navigation-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useSlides } from '../../contexts/slide-context';

export function useContinuousSlideSections() {
  const { currentDeckItemId, currentOutputDeckItemId } = useNavigation();
  const { currentSlideIndex, liveSlideIndex, activateDeckItemSlide, focusDeckItemSlide } = useSlides();
  const { slideElementsBySlideId } = useProjectContent();

  const handleActivateSlide = useCallback((itemId: Id, slideIndex: number) => {
    activateDeckItemSlide(itemId, slideIndex);
  }, [activateDeckItemSlide]);

  const handleEditSlide = useCallback((itemId: Id, slideIndex: number) => {
    focusDeckItemSlide(itemId, slideIndex);
  }, [focusDeckItemSlide]);

  return {
    currentDeckItemId,
    currentOutputDeckItemId,
    currentSlideIndex,
    liveSlideIndex,
    slideElementsBySlideId,
    handleActivateSlide,
    handleEditSlide,
  };
}

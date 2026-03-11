import { useMemo } from 'react';
import type { Id, MediaAsset, Overlay, Presentation, Slide, SlideElement } from '@core/types';
import { sortElements, sortSlides } from '../utils/slides';
import { useCast } from './cast-context';

interface ProjectContent {
  presentations: Presentation[];
  slides: Slide[];
  slideElements: SlideElement[];
  mediaAssets: MediaAsset[];
  overlays: Overlay[];
  presentationsById: ReadonlyMap<Id, Presentation>;
  slidesByPresentationId: ReadonlyMap<Id, Slide[]>;
  slideElementsBySlideId: ReadonlyMap<Id, SlideElement[]>;
  mediaAssetsById: ReadonlyMap<Id, MediaAsset>;
  overlaysById: ReadonlyMap<Id, Overlay>;
}

export function useProjectContent(): ProjectContent {
  const { snapshot } = useCast();

  return useMemo(() => {
    const presentations = snapshot?.presentations ?? [];
    const slides = snapshot?.slides ?? [];
    const slideElements = snapshot?.slideElements ?? [];
    const mediaAssets = snapshot?.mediaAssets ?? [];
    const overlays = snapshot?.overlays ?? [];

    const presentationsById = new Map<Id, Presentation>();
    const slidesByPresentationId = new Map<Id, Slide[]>();
    const slideElementsBySlideId = new Map<Id, SlideElement[]>();
    const mediaAssetsById = new Map<Id, MediaAsset>();
    const overlaysById = new Map<Id, Overlay>();

    for (const presentation of presentations) {
      presentationsById.set(presentation.id, presentation);
      slidesByPresentationId.set(presentation.id, []);
    }

    for (const slide of slides) {
      const existingSlides = slidesByPresentationId.get(slide.presentationId) ?? [];
      existingSlides.push(slide);
      slidesByPresentationId.set(slide.presentationId, existingSlides);
      slideElementsBySlideId.set(slide.id, []);
    }

    for (const element of slideElements) {
      const existingElements = slideElementsBySlideId.get(element.slideId) ?? [];
      existingElements.push(element);
      slideElementsBySlideId.set(element.slideId, existingElements);
    }

    for (const asset of mediaAssets) {
      mediaAssetsById.set(asset.id, asset);
    }

    for (const overlay of overlays) {
      overlaysById.set(overlay.id, overlay);
    }

    slidesByPresentationId.forEach((presentationSlides, presentationId) => {
      slidesByPresentationId.set(presentationId, sortSlides(presentationSlides));
    });

    slideElementsBySlideId.forEach((elements, slideId) => {
      slideElementsBySlideId.set(slideId, sortElements(elements));
    });

    return {
      presentations,
      slides,
      slideElements,
      mediaAssets,
      overlays,
      presentationsById,
      slidesByPresentationId,
      slideElementsBySlideId,
      mediaAssetsById,
      overlaysById,
    };
  }, [snapshot]);
}

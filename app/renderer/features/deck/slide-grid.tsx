import { useSlides } from '../../contexts/slide-context';
import { useNavigation } from '../../contexts/navigation-context';
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import { useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useDeckBrowser } from './deck-browser-context';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { SlideGridTile } from './slide-grid-tile';

export function SlideGrid() {
  const { currentDeckItemId, currentOutputDeckItemId, isDetachedDeckBrowser } = useNavigation();
  const { slides, currentSlideIndex, liveSlideIndex, slideElementsById, activateSlide, setCurrentSlideIndex } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const { gridItemSize } = useDeckBrowser();
  const showLiveState = !isDetachedDeckBrowser && currentDeckItemId === currentOutputDeckItemId;

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label="Slides">
        {slides.map((slide, idx) => {
          const elements = slideElementsById.get(slide.id) ?? [];
          const scene = getThumbnailScene(slide.id, 'show');
          if (!scene) return null;
          const state = getSlideVisualState(idx, showLiveState ? liveSlideIndex : -1, currentSlideIndex, elements);

          return (
            <SlideGridTile
              key={slide.id}
              slideId={slide.id}
              index={idx}
              scene={scene}
              selected={idx === currentSlideIndex}
              isLive={state === 'live'}
              isEmpty={state === 'warning'}
              textPreview={slideTextPreview(elements)}
              onActivate={activateSlide}
              onFocus={setCurrentSlideIndex}
            />
          );
        })}
      </ThumbnailGrid>
    </section>
  );
}

import { useSlides } from '../../contexts/slide-context';
import { useNavigation } from '../../contexts/navigation-context';
import { getSlideVisualState } from '../../utils/slides';
import { useRenderScenes } from '../stage/render-scene-provider';
import { useSlideBrowser } from './slide-browser-context';
import { SlideCard } from './slide-card';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';

export function SlideGrid() {
  const { currentContentItemId, currentOutputContentItemId, isDetachedContentBrowser } = useNavigation();
  const { slides, currentSlideIndex, liveSlideIndex, slideElementsById, activateSlide, setCurrentSlideIndex } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const { gridItemSize } = useSlideBrowser();
  const showLiveState = !isDetachedContentBrowser && currentContentItemId === currentOutputContentItemId;

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label="Slides">
        {slides.map((slide, idx) => {
          const elements = slideElementsById.get(slide.id) ?? [];
          const scene = getThumbnailScene(slide.id, 'show');
          if (!scene) return null;
          const state = getSlideVisualState(idx, showLiveState ? liveSlideIndex : -1, currentSlideIndex, elements);

          return (
            <SlideCard
              index={idx}
              state={state}
              scene={scene}
              elements={elements}
              isFocused={idx === currentSlideIndex}
              onActivate={() => activateSlide(idx)}
              onEdit={() => setCurrentSlideIndex(idx)}
            />
          )
        })}
      </ThumbnailGrid>
    </section>
  );
}
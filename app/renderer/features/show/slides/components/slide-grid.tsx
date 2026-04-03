import { useSlides } from '../../../../contexts/slide-context';
import { useSlideBrowser } from '../contexts/slide-browser-context';
import { useNavigation } from '../../../../contexts/navigation-context';
import { getSlideVisualState } from '../../../../utils/slides';
import { useRenderScenes } from '../../../stage/rendering/render-scene-provider';
import { SlideCard } from './slide-card';

export function SlideGrid() {
  const { currentContentItemId, currentOutputContentItemId, isDetachedContentBrowser } = useNavigation();
  const { slides, currentSlideIndex, liveSlideIndex, slideElementsById, activateSlide, setCurrentSlideIndex } = useSlides();
  const { setSlideBrowserMode } = useSlideBrowser();
  const { getThumbnailScene } = useRenderScenes();
  const showLiveState = !isDetachedContentBrowser && currentContentItemId === currentOutputContentItemId;

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] auto-rows-max content-start" role="grid" aria-label="Slides">
        {slides.map((slide, idx) => {
          const elements = slideElementsById.get(slide.id) ?? [];
          const scene = getThumbnailScene(slide.id, 'show');
          if (!scene) return null;
          const state = getSlideVisualState(idx, showLiveState ? liveSlideIndex : -1, currentSlideIndex, elements);

          function handleActivate() { activateSlide(idx); }
          function handleEdit() { setCurrentSlideIndex(idx); setSlideBrowserMode('focus'); }

          return (
            <SlideCard
              key={slide.id}
              index={idx}
              state={state}
              scene={scene}
              elements={elements}
              isFocused={idx === currentSlideIndex}
              onActivate={handleActivate}
              onEdit={handleEdit}
            />
          );
        })}
      </div>
    </section>
  );
}

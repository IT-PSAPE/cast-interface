import { useSlides } from '../../../../contexts/slide-context';
import { useNavigation } from '../../../../contexts/navigation-context';
import { getSlideVisualState } from '../../../../utils/slides';
import { useRenderScenes } from '../../../stage/rendering/render-scene-provider';
import { useSlideBrowser } from '../contexts/slide-browser-context';
import { SlideCard } from './slide-card';
import { ThumbnailGrid } from '../../../../components/layout/thumbnail-grid';
import type { RenderScene } from '../../../stage/rendering/scene-types';
import type { SlideElement } from '@core/types';
import type { SlideVisualState } from '../../../../types/ui';

export function SlideGrid() {
  const { currentContentItemId, currentOutputContentItemId, isDetachedContentBrowser } = useNavigation();
  const { slides, currentSlideIndex, liveSlideIndex, slideElementsById, activateSlide, setCurrentSlideIndex } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const { gridItemSize } = useSlideBrowser();
  const showLiveState = !isDetachedContentBrowser && currentContentItemId === currentOutputContentItemId;

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <ThumbnailGrid itemSize={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label="Slides">
        {slides.map((slide, idx) => {
          const elements = slideElementsById.get(slide.id) ?? [];
          const scene = getThumbnailScene(slide.id, 'show');
          if (!scene) return null;
          const state = getSlideVisualState(idx, showLiveState ? liveSlideIndex : -1, currentSlideIndex, elements);

          return (
            <SlideGridItem
              key={slide.id}
              index={idx}
              state={state}
              scene={scene}
              elements={elements}
              isFocused={idx === currentSlideIndex}
              onActivate={activateSlide}
              onEdit={setCurrentSlideIndex}
            />
          );
        })}
      </ThumbnailGrid>
    </section>
  );
}

interface SlideGridItemProps {
  index: number;
  state: SlideVisualState;
  scene: RenderScene;
  elements: SlideElement[];
  isFocused: boolean;
  onActivate: (index: number) => void;
  onEdit: (index: number) => void;
}

function SlideGridItem({ index, state, scene, elements, isFocused, onActivate, onEdit }: SlideGridItemProps) {
  function handleActivate() {
    onActivate(index);
  }

  function handleEdit() {
    onEdit(index);
  }

  return (
    <SlideCard
      index={index}
      state={state}
      scene={scene}
      elements={elements}
      isFocused={isFocused}
      onActivate={handleActivate}
      onEdit={handleEdit}
    />
  );
}

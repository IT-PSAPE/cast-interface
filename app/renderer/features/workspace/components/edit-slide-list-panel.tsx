import { ActionButton } from '../../../components/action-button';
import { useNavigation } from '../../../contexts/navigation-context';
import { useElements } from '../../../contexts/element-context';
import { useSlides } from '../../../contexts/slide-context';
import { getSlideVisualState } from '../../../utils/slides';
import { useRenderScenes } from '../rendering/render-scene-provider';
import { EditObjectListPanel } from './edit-object-list-panel';
import { SlideCard } from './slide-card';

export function EditSlideListPanel() {
  const { currentPresentation } = useNavigation();
  const { effectiveElements } = useElements();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, slideElementsById, setCurrentSlideIndex, createSlide } = useSlides();
  const { getThumbnailScene } = useRenderScenes();

  function handleAddSlide() {
    void createSlide();
  }

  function renderSlide(slide: (typeof slides)[number], index: number) {
    const elements = currentSlide?.id === slide.id
      ? effectiveElements
      : (slideElementsById.get(slide.id) ?? []);
    const scene = getThumbnailScene(slide.id, 'edit');
    if (!scene) return null;
    const state = getSlideVisualState(index, liveSlideIndex, currentSlideIndex, elements);

    function handleSelect() {
      setCurrentSlideIndex(index);
    }

    return (
      <SlideCard
        key={slide.id}
        index={index}
        state={state}
        scene={scene}
        elements={elements}
        isFocused={index === currentSlideIndex}
        onActivate={handleSelect}
        onEdit={handleSelect}
      />
    );
  }

  return (
    <aside className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_minmax(0,240px)] overflow-hidden border-r border-stroke bg-surface-1">
      <header className="flex h-8 items-center gap-2 border-b border-stroke px-2">
        <span className="truncate text-[12px] font-medium text-text-primary" title={currentPresentation?.title ?? 'No presentation selected'}>
          {currentPresentation?.title ?? 'No presentation selected'}
        </span>
        <ActionButton onClick={handleAddSlide} className="ml-auto grid h-6 w-6 place-items-center p-0 text-[14px] leading-none">
          <span aria-hidden="true">+</span>
          <span className="sr-only">Add slide</span>
        </ActionButton>
      </header>

      <div className="min-h-0 overflow-y-auto p-2">
        <div className="grid content-start gap-2" role="grid" aria-label="Presentation slides">
          {slides.map(renderSlide)}
        </div>
      </div>

      <header className="flex h-8 items-center border-y border-stroke px-2">
        <span className="text-[12px] font-medium text-text-primary">Objects</span>
      </header>

      <div className="min-h-0 overflow-y-auto p-2">
        <EditObjectListPanel />
      </div>
    </aside>
  );
}

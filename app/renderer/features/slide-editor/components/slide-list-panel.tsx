import { Button } from '../../../components/button';
import { PanelSection } from '../../../components/panel-section';
import { TwoPaneVerticalSplit } from '../../../components/resizable-split';
import { useNavigation } from '../../../contexts/navigation-context';
import { useElements } from '../../../contexts/element-context';
import { useSlideEditor } from '../../../contexts/slide-editor-context';
import { useSlides } from '../../../contexts/slide-context';
import { getSlideVisualState } from '../../../utils/slides';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { ObjectListPanel } from './object-list-panel';
import { SlideCard } from '../../slide-browser/components/slide-card';

export function SlideListPanel() {
  const { currentPresentation } = useNavigation();
  const { effectiveElements } = useElements();
  const { getSlideElements } = useSlideEditor();
  const { slides, currentSlide, currentSlideIndex, liveSlideIndex, setCurrentSlideIndex, createSlide } = useSlides();
  const { getThumbnailScene } = useRenderScenes();

  function handleAddSlide() {
    void createSlide();
  }

  function renderSlide(slide: (typeof slides)[number], index: number) {
    const elements = currentSlide?.id === slide.id
      ? effectiveElements
      : getSlideElements(slide.id);
    const scene = getThumbnailScene(slide.id, 'slide-editor');
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
    <aside
      data-ui-region="slide-list-panel"
      className="h-full min-h-0 overflow-hidden border-r border-border-primary bg-background-primary_alt"
    >
      <TwoPaneVerticalSplit
        className="h-full"
        topPaneId="slide-list"
        bottomPaneId="slide-objects"
        defaultTopSize={440}
        defaultBottomSize={220}
        minTopSize={180}
        minBottomSize={160}
        topPane={(
          <PanelSection
            title={(
              <span className="truncate text-[12px] font-medium text-text-primary" title={currentPresentation?.title ?? 'No presentation selected'}>
                {currentPresentation?.title ?? 'No presentation selected'}
              </span>
            )}
            action={(
              <Button onClick={handleAddSlide} className="grid h-6 w-6 place-items-center p-0 text-[14px] leading-none">
                <span aria-hidden="true">+</span>
                <span className="sr-only">Add slide</span>
              </Button>
            )}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-2" role="grid" aria-label="Presentation slides">
              {slides.map(renderSlide)}
            </div>
          </PanelSection>
        )}
        bottomPane={(
          <PanelSection
            title={<span className="text-[12px] font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        )}
      />
    </aside>
  );
}

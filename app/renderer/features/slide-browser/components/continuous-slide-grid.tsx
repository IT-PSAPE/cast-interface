import { useCallback, useMemo } from 'react';
import type { Id, Slide, SlideElement } from '@core/types';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { getSlideVisualState, sortElements } from '../../../utils/slides';
import type { PlaylistPresentationSequenceItem } from '../hooks/use-playlist-presentation-sequence';
import { buildThumbnailScene } from '../../stage/rendering/build-render-scene';
import { SlideCard } from '../../slide-browser/components/slide-card';

interface ContinuousSlideGridProps {
  items: PlaylistPresentationSequenceItem[];
}

interface GridSectionProps {
  item: PlaylistPresentationSequenceItem;
  currentPresentationId: Id | null;
  currentSlideIndex: number;
  liveSlideIndex: number;
  slideElementsById: Map<Id, SlideElement[]>;
  onActivateSlide: (presentationId: Id, slideIndex: number) => void;
  onEditSlide: (presentationId: Id, slideIndex: number) => void;
}

function GridSection({
  item,
  currentPresentationId,
  currentSlideIndex,
  liveSlideIndex,
  slideElementsById,
  onActivateSlide,
  onEditSlide,
}: GridSectionProps) {
  const isCurrentPresentation = item.presentation.id === currentPresentationId;

  const renderSlideCard = useCallback((slide: Slide, index: number) => {
    const elements = slideElementsById.get(slide.id) ?? [];
    const state = getSlideVisualState(
      index,
      isCurrentPresentation ? liveSlideIndex : -1,
      isCurrentPresentation ? currentSlideIndex : -1,
      elements,
    );
    const scene = buildThumbnailScene(slide, elements);

    function handleActivate() {
      onActivateSlide(item.presentation.id, index);
    }

    function handleEdit() {
      onEditSlide(item.presentation.id, index);
    }

    return (
      <SlideCard
        key={slide.id}
        index={index}
        state={state}
        scene={scene}
        elements={elements}
        isFocused={isCurrentPresentation && index === currentSlideIndex}
        onActivate={handleActivate}
        onEdit={handleEdit}
      />
    );
  }, [currentSlideIndex, isCurrentPresentation, item.presentation.id, liveSlideIndex, onActivateSlide, onEditSlide, slideElementsById]);

  return (
    <section className="grid gap-2">
      <header className="px-1">
        <h3 className="m-0 text-[12px] font-semibold text-text-primary">{item.presentation.title}</h3>
      </header>
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] auto-rows-max content-start" role="grid" aria-label={`${item.presentation.title} slides`}>
        {item.slides.map(renderSlideCard)}
      </div>
    </section>
  );
}

export function ContinuousSlideGrid({ items }: ContinuousSlideGridProps) {
  const { activeBundle, currentPresentationId } = useNavigation();
  const { currentSlideIndex, liveSlideIndex, activatePresentationSlide, focusPresentationSlide } = useSlides();
  const { setSlideBrowserMode } = useSlideBrowser();

  const slideElementsById = useMemo(() => {
    const bySlide = new Map<Id, SlideElement[]>();
    if (!activeBundle) return bySlide;

    for (const slide of activeBundle.slides) {
      bySlide.set(slide.id, []);
    }
    for (const element of activeBundle.slideElements) {
      const existing = bySlide.get(element.slideId);
      if (!existing) continue;
      existing.push(element);
    }
    bySlide.forEach((elements, slideId) => {
      bySlide.set(slideId, sortElements(elements));
    });
    return bySlide;
  }, [activeBundle]);

  const handleActivateSlide = useCallback((presentationId: Id, slideIndex: number) => {
    activatePresentationSlide(presentationId, slideIndex);
  }, [activatePresentationSlide]);

  const handleEditSlide = useCallback((presentationId: Id, slideIndex: number) => {
    focusPresentationSlide(presentationId, slideIndex);
    setSlideBrowserMode('focus');
  }, [focusPresentationSlide, setSlideBrowserMode]);

  const renderSection = useCallback((item: PlaylistPresentationSequenceItem) => {
    return (
      <GridSection
        key={item.entryId}
        item={item}
        currentPresentationId={currentPresentationId}
        currentSlideIndex={currentSlideIndex}
        liveSlideIndex={liveSlideIndex}
        slideElementsById={slideElementsById}
        onActivateSlide={handleActivateSlide}
        onEditSlide={handleEditSlide}
      />
    );
  }, [currentPresentationId, currentSlideIndex, handleActivateSlide, handleEditSlide, liveSlideIndex, slideElementsById]);

  if (items.length === 0) {
    return (
      <section className="grid h-full min-h-0 place-items-center text-[12px] text-text-muted">
        No playlist presentations available.
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-y-auto p-2">
      <div className="grid content-start gap-5" role="list" aria-label="Continuous playlist grid">
        {items.map(renderSection)}
      </div>
    </section>
  );
}

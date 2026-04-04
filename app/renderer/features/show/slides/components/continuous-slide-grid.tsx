import { useCallback } from 'react';
import type { Id, Slide, SlideElement } from '@core/types';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useProjectContent } from '../../../../contexts/use-project-content';
import { useSlides } from '../../../../contexts/slide-context';
import { getSlideVisualState } from '../../../../utils/slides';
import type { PlaylistPresentationSequenceItem } from '../hooks/use-playlist-presentation-sequence';
import { buildThumbnailScene } from '../../../stage/rendering/build-render-scene';
import { SlideCard } from './slide-card';

interface ContinuousSlideGridProps {
  items: PlaylistPresentationSequenceItem[];
}

interface GridSectionProps {
  item: PlaylistPresentationSequenceItem;
  currentContentItemId: Id | null;
  currentOutputContentItemId: Id | null;
  currentSlideIndex: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  onActivateSlide: (itemId: Id, slideIndex: number) => void;
  onEditSlide: (itemId: Id, slideIndex: number) => void;
}

function GridSection({
  item,
  currentContentItemId,
  currentOutputContentItemId,
  currentSlideIndex,
  liveSlideIndex,
  slideElementsById,
  onActivateSlide,
  onEditSlide,
}: GridSectionProps) {
  const isCurrentPresentation = item.item.id === currentContentItemId;
  const isLivePresentation = item.item.id === currentOutputContentItemId;

  const renderSlideCard = useCallback((slide: Slide, index: number) => {
    const elements = slideElementsById.get(slide.id) ?? [];
    const state = getSlideVisualState(
      index,
      isLivePresentation ? liveSlideIndex : -1,
      isCurrentPresentation ? currentSlideIndex : -1,
      elements,
    );
    const scene = buildThumbnailScene(slide, elements);

    function handleActivate() {
      onActivateSlide(item.item.id, index);
    }

    function handleEdit() {
      onEditSlide(item.item.id, index);
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
  }, [currentSlideIndex, isCurrentPresentation, isLivePresentation, item.item.id, liveSlideIndex, onActivateSlide, onEditSlide, slideElementsById]);

  return (
    <section className="grid gap-2">
      <header className="px-1">
        <h3 className="m-0 text-sm font-semibold text-text-primary">{item.item.title}</h3>
      </header>
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] auto-rows-max content-start" role="grid" aria-label={`${item.item.title} slides`}>
        {item.slides.map(renderSlideCard)}
      </div>
    </section>
  );
}

export function ContinuousSlideGrid({ items }: ContinuousSlideGridProps) {
  const { currentContentItemId, currentOutputContentItemId } = useNavigation();
  const { currentSlideIndex, liveSlideIndex, activateContentItemSlide, focusContentItemSlide } = useSlides();
  const { slideElementsBySlideId } = useProjectContent();

  const handleActivateSlide = useCallback((itemId: Id, slideIndex: number) => {
    activateContentItemSlide(itemId, slideIndex);
  }, [activateContentItemSlide]);

  const handleEditSlide = useCallback((itemId: Id, slideIndex: number) => {
    focusContentItemSlide(itemId, slideIndex);
  }, [focusContentItemSlide]);

  const renderSection = useCallback((item: PlaylistPresentationSequenceItem) => {
    return (
      <GridSection
        key={item.entryId}
        item={item}
        currentContentItemId={currentContentItemId}
        currentOutputContentItemId={currentOutputContentItemId}
        currentSlideIndex={currentSlideIndex}
        liveSlideIndex={liveSlideIndex}
        slideElementsById={slideElementsBySlideId}
        onActivateSlide={handleActivateSlide}
        onEditSlide={handleEditSlide}
      />
    );
  }, [currentContentItemId, currentOutputContentItemId, currentSlideIndex, handleActivateSlide, handleEditSlide, liveSlideIndex, slideElementsBySlideId]);

  if (items.length === 0) {
    return (
      <section className="grid h-full min-h-0 place-items-center text-sm text-text-tertiary">
        No playlist items available.
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <div className="grid content-start gap-5" role="list" aria-label="Continuous playlist grid">
        {items.map(renderSection)}
      </div>
    </section>
  );
}

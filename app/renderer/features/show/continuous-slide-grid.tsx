import { useCallback } from 'react';
import type { Id, Slide, SlideElement } from '@core/types';
import { getSlideVisualState } from '../../utils/slides';
import type { PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';
import { buildThumbnailScene } from '../stage/build-render-scene';
import { useSlideBrowser } from './slide-browser-context';
import { useContinuousSlideSections } from './use-continuous-slide-sections';
import { SlideCard } from './slide-card';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';

interface ContinuousSlideGridProps {
  items: PlaylistPresentationSequenceItem[];
}

interface GridSectionProps {
  item: PlaylistPresentationSequenceItem;
  currentDeckItemId: Id | null;
  currentOutputDeckItemId: Id | null;
  currentSlideIndex: number;
  gridItemSize: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  onActivateSlide: (itemId: Id, slideIndex: number) => void;
  onEditSlide: (itemId: Id, slideIndex: number) => void;
}

function GridSection({ item, currentDeckItemId, currentOutputDeckItemId, currentSlideIndex, gridItemSize, liveSlideIndex, slideElementsById, onActivateSlide, onEditSlide }: GridSectionProps) {
  const isCurrentPresentation = item.item.id === currentDeckItemId;
  const isLivePresentation = item.item.id === currentOutputDeckItemId;

  const renderSlideCard = useCallback((slide: Slide, index: number) => {
    const elements = slideElementsById.get(slide.id) ?? [];
    const state = getSlideVisualState(index, isLivePresentation ? liveSlideIndex : -1, isCurrentPresentation ? currentSlideIndex : -1, elements);
    const scene = buildThumbnailScene(slide, elements);

    function handleActivate() {
      onActivateSlide(item.item.id, index);
    }

    function handleEdit() {
      onEditSlide(item.item.id, index);
    }

    return (
      <SlideCard key={slide.id} index={index} state={state} scene={scene} elements={elements} isFocused={isCurrentPresentation && index === currentSlideIndex} onActivate={handleActivate} onEdit={handleEdit} />
    );
  }, [currentSlideIndex, isCurrentPresentation, isLivePresentation, item.item.id, liveSlideIndex, onActivateSlide, onEditSlide, slideElementsById]);

  return (
    <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label={`${item.item.title} slides`}>
      {item.slides.map(renderSlideCard)}
    </ThumbnailGrid>
  );
}

export function ContinuousSlideGrid({ items }: ContinuousSlideGridProps) {
  const { currentDeckItemId, currentOutputDeckItemId, currentSlideIndex, liveSlideIndex, slideElementsBySlideId, handleActivateSlide, handleEditSlide } = useContinuousSlideSections();
  const { gridItemSize } = useSlideBrowser();

  if (items.length === 0) {
    return (
      <section className="grid h-full min-h-0 place-items-center text-sm text-tertiary">
        No playlist items available.
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <div className="flex flex-col gap-2" role="list" aria-label="Continuous playlist grid">
        {items.map((item) => (
          <GridSection
            key={item.entryId}
            item={item}
            currentDeckItemId={currentDeckItemId}
            currentOutputDeckItemId={currentOutputDeckItemId}
            currentSlideIndex={currentSlideIndex}
            gridItemSize={gridItemSize}
            liveSlideIndex={liveSlideIndex}
            slideElementsById={slideElementsBySlideId}
            onActivateSlide={handleActivateSlide}
            onEditSlide={handleEditSlide}
          />
        ))}
      </div>
    </section>
  );
}

import { useCallback } from 'react';
import { isLyricDeckItem } from '@core/deck-items';
import type { Id, Slide, SlideElement } from '@core/types';
import { getSlideVisualState, slideTextDetails } from '../../utils/slides';
import type { PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';
import { useSlideOutlineTextEditing } from './use-slide-outline-text-editing';
import { buildThumbnailScene } from '../stage/build-render-scene';
import type { OutlineSlideRow } from './use-slide-list-view';
import { useContinuousSlideSections } from './use-continuous-slide-sections';
import { SlideOutlineRow } from './slide-list-row';

interface ContinuousSlideListProps {
  items: PlaylistPresentationSequenceItem[];
}

interface OutlineSectionProps {
  item: PlaylistPresentationSequenceItem;
  currentDeckItemId: Id | null;
  currentOutputDeckItemId: Id | null;
  currentSlideIndex: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  onSelectSlide: (itemId: Id, slideIndex: number) => void;
  onOpenSlide: (itemId: Id, slideIndex: number) => void;
}

function OutlineSection({ item, currentDeckItemId, currentOutputDeckItemId, currentSlideIndex, liveSlideIndex, slideElementsById, onSelectSlide, onOpenSlide }: OutlineSectionProps) {
  const { updateText } = useSlideOutlineTextEditing();
  const isCurrentPresentation = item.item.id === currentDeckItemId;
  const isLivePresentation = item.item.id === currentOutputDeckItemId;
  const textEditable = isLyricDeckItem(item.item);

  const renderRow = useCallback((slide: Slide, index: number) => {
    const elements = slideElementsById.get(slide.id) ?? [];
    const details = slideTextDetails(elements);
    const scene = buildThumbnailScene(slide, elements);
    const row = {
      slide,
      index,
      state: getSlideVisualState(index, isLivePresentation ? liveSlideIndex : -1, isCurrentPresentation ? currentSlideIndex : -1, elements),
      elements,
      text: details.text,
      primaryText: details.primaryLine,
      secondaryText: details.secondaryLine,
      textElementId: details.textElement?.id ?? null,
      textEditable,
    } satisfies OutlineSlideRow;

    function handleSelect() {
      onSelectSlide(item.item.id, index);
    }

    function handleOpen() {
      onOpenSlide(item.item.id, index);
    }

    function handleTextCommit(_slideId: Id, nextText: string) {
      updateText({ elements: row.elements, nextText, slideIndex: row.index, textEditable: row.textEditable, textElementId: row.textElementId });
    }

    return (
      <SlideOutlineRow key={slide.id} row={row} scene={scene} isFocused={isCurrentPresentation && index === currentSlideIndex} onSelect={handleSelect} onOpen={handleOpen} onTextCommit={handleTextCommit} />
    );
  }, [currentSlideIndex, isCurrentPresentation, isLivePresentation, item.item.id, liveSlideIndex, onOpenSlide, onSelectSlide, slideElementsById, textEditable, updateText]);

  return (
    <section className="flex flex-col gap-2">
      <header className="px-1">
        <h3 className="m-0 text-sm font-semibold text-primary">{item.item.title}</h3>
      </header>
      <div className="flex flex-col gap-1" role="list" aria-label={`${item.item.title} outline`}>
        {item.slides.map(renderRow)}
      </div>
    </section>
  );
}

export function ContinuousSlideList({ items }: ContinuousSlideListProps) {
  const { currentDeckItemId, currentOutputDeckItemId, currentSlideIndex, liveSlideIndex, slideElementsBySlideId, handleActivateSlide, handleEditSlide } = useContinuousSlideSections();

  if (items.length === 0) {
    return (
      <section className="grid h-full min-h-0 place-items-center text-sm text-tertiary">
        No playlist items available.
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <div className="flex flex-col gap-5" role="list" aria-label="Continuous playlist outline">
        {items.map((item) => (
          <OutlineSection
            key={item.entryId}
            item={item}
            currentDeckItemId={currentDeckItemId}
            currentOutputDeckItemId={currentOutputDeckItemId}
            currentSlideIndex={currentSlideIndex}
            liveSlideIndex={liveSlideIndex}
            slideElementsById={slideElementsBySlideId}
            onSelectSlide={handleActivateSlide}
            onOpenSlide={handleEditSlide}
          />
        ))}
      </div>
    </section>
  );
}

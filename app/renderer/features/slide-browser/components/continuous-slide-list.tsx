import { useCallback } from 'react';
import { isLyricPresentation } from '@core/presentation-entities';
import type { Id, Slide, SlideElement } from '@core/types';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useSlides } from '../../../contexts/slide-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { getSlideVisualState, slideTextDetails } from '../../../utils/slides';
import type { PlaylistPresentationSequenceItem } from '../hooks/use-playlist-presentation-sequence';
import { useSlideOutlineTextEditing } from '../hooks/use-slide-outline-text-editing';
import { buildThumbnailScene } from '../../stage/rendering/build-render-scene';
import type { OutlineSlideRow } from '../hooks/use-slide-list-view';
import { SlideOutlineRow } from './slide-list-row';

interface ContinuousSlideListProps {
  items: PlaylistPresentationSequenceItem[];
}

interface OutlineSectionProps {
  item: PlaylistPresentationSequenceItem;
  currentPresentationId: Id | null;
  currentOutputPresentationId: Id | null;
  currentSlideIndex: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  onSelectSlide: (presentationId: Id, slideIndex: number) => void;
  onOpenSlide: (presentationId: Id, slideIndex: number) => void;
}

function OutlineSection({
  item,
  currentPresentationId,
  currentOutputPresentationId,
  currentSlideIndex,
  liveSlideIndex,
  slideElementsById,
  onSelectSlide,
  onOpenSlide,
}: OutlineSectionProps) {
  const { updateText } = useSlideOutlineTextEditing();
  const isCurrentPresentation = item.presentation.id === currentPresentationId;
  const isLivePresentation = item.presentation.id === currentOutputPresentationId;
  const textEditable = isLyricPresentation(item.presentation);

  const renderRow = useCallback((slide: Slide, index: number) => {
    const elements = slideElementsById.get(slide.id) ?? [];
    const details = slideTextDetails(elements);
    const scene = buildThumbnailScene(slide, elements);
    const row = {
      slide,
      index,
      state: getSlideVisualState(
        index,
        isLivePresentation ? liveSlideIndex : -1,
        isCurrentPresentation ? currentSlideIndex : -1,
        elements,
      ),
      elements,
      text: details.text,
      primaryText: details.primaryLine,
      secondaryText: details.secondaryLine,
      textElementId: details.textElement?.id ?? null,
      textEditable,
    } satisfies OutlineSlideRow;

    function handleSelect() {
      onSelectSlide(item.presentation.id, index);
    }

    function handleOpen() {
      onOpenSlide(item.presentation.id, index);
    }

    function handleTextCommit(_slideId: Id, nextText: string) {
      updateText({
        elements: row.elements,
        nextText,
        slideIndex: row.index,
        textEditable: row.textEditable,
        textElementId: row.textElementId,
      });
    }

    return (
      <SlideOutlineRow
        key={slide.id}
        row={row}
        scene={scene}
        isFocused={isCurrentPresentation && index === currentSlideIndex}
        onSelect={handleSelect}
        onOpen={handleOpen}
        onTextCommit={handleTextCommit}
      />
    );
  }, [currentSlideIndex, isCurrentPresentation, isLivePresentation, item.presentation.id, liveSlideIndex, onOpenSlide, onSelectSlide, slideElementsById, textEditable, updateText]);

  return (
    <section className="grid gap-2">
      <header className="px-1">
        <h3 className="m-0 text-sm font-semibold text-text-primary">{item.presentation.title}</h3>
      </header>
      <div className="grid content-start gap-2" role="list" aria-label={`${item.presentation.title} outline`}>
        {item.slides.map(renderRow)}
      </div>
    </section>
  );
}

export function ContinuousSlideList({ items }: ContinuousSlideListProps) {
  const { currentPresentationId, currentOutputPresentationId } = useNavigation();
  const { currentSlideIndex, liveSlideIndex, activatePresentationSlide, focusPresentationSlide } = useSlides();
  const { setSlideBrowserMode } = useSlideBrowser();
  const { slideElementsBySlideId } = useProjectContent();

  const handleSelectSlide = useCallback((presentationId: Id, slideIndex: number) => {
    activatePresentationSlide(presentationId, slideIndex);
  }, [activatePresentationSlide]);

  const handleOpenSlide = useCallback((presentationId: Id, slideIndex: number) => {
    focusPresentationSlide(presentationId, slideIndex);
    setSlideBrowserMode('focus');
  }, [focusPresentationSlide, setSlideBrowserMode]);

  const renderSection = useCallback((item: PlaylistPresentationSequenceItem) => {
    return (
      <OutlineSection
        key={item.entryId}
        item={item}
        currentPresentationId={currentPresentationId}
        currentOutputPresentationId={currentOutputPresentationId}
        currentSlideIndex={currentSlideIndex}
        liveSlideIndex={liveSlideIndex}
        slideElementsById={slideElementsBySlideId}
        onSelectSlide={handleSelectSlide}
        onOpenSlide={handleOpenSlide}
      />
    );
  }, [currentOutputPresentationId, currentPresentationId, currentSlideIndex, handleOpenSlide, handleSelectSlide, liveSlideIndex, slideElementsBySlideId]);

  if (items.length === 0) {
    return (
      <section className="grid h-full min-h-0 place-items-center text-sm text-text-tertiary">
        No playlist presentations available.
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <div className="grid content-start gap-5" role="list" aria-label="Continuous playlist outline">
        {items.map(renderSection)}
      </div>
    </section>
  );
}

import { useCallback, useMemo } from 'react';
import type { Id, Slide, SlideElement } from '@core/types';
import { useNavigation } from '../../../contexts/navigation-context';
import { useProjectContent } from '../../../contexts/use-project-content';
import { useSlides } from '../../../contexts/slide-context';
import { useSlideBrowser } from '../../../contexts/slide-browser-context';
import { getSlideVisualState, slideTextDetails } from '../../../utils/slides';
import type { PlaylistPresentationSequenceItem } from '../hooks/use-playlist-presentation-sequence';
import { buildThumbnailScene } from '../../stage/rendering/build-render-scene';
import type { OutlineSlideRow } from '../hooks/use-slide-list-view';
import { SlideOutlineRow } from './slide-list-row';

interface ContinuousSlideListProps {
  items: PlaylistPresentationSequenceItem[];
}

interface OutlineSectionProps {
  item: PlaylistPresentationSequenceItem;
  currentPresentationId: Id | null;
  currentPlaylistPresentationId: Id | null;
  currentSlideIndex: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  onSelectSlide: (presentationId: Id, slideIndex: number) => void;
  onOpenSlide: (presentationId: Id, slideIndex: number) => void;
}

function noopPrimaryTextCommit(_slideId: Id, _nextPrimary: string) {}

function OutlineSection({
  item,
  currentPresentationId,
  currentPlaylistPresentationId,
  currentSlideIndex,
  liveSlideIndex,
  slideElementsById,
  onSelectSlide,
  onOpenSlide,
}: OutlineSectionProps) {
  const isCurrentPresentation = item.presentation.id === currentPresentationId;
  const isLivePresentation = item.presentation.id === currentPlaylistPresentationId;

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
      primaryText: details.primaryLine,
      secondaryText: details.secondaryLine,
      textElementId: null,
      textEditable: false,
    } satisfies OutlineSlideRow;

    function handleSelect() {
      onSelectSlide(item.presentation.id, index);
    }

    function handleOpen() {
      onOpenSlide(item.presentation.id, index);
    }

    return (
      <SlideOutlineRow
        key={slide.id}
        row={row}
        scene={scene}
        isFocused={isCurrentPresentation && index === currentSlideIndex}
        onSelect={handleSelect}
        onOpen={handleOpen}
        onPrimaryTextCommit={noopPrimaryTextCommit}
      />
    );
  }, [currentSlideIndex, isCurrentPresentation, isLivePresentation, item.presentation.id, liveSlideIndex, onOpenSlide, onSelectSlide, slideElementsById]);

  return (
    <section className="grid gap-2">
      <header className="px-1">
        <h3 className="m-0 text-[12px] font-semibold text-text-primary">{item.presentation.title}</h3>
      </header>
      <div className="grid content-start gap-2" role="list" aria-label={`${item.presentation.title} outline`}>
        {item.slides.map(renderRow)}
      </div>
    </section>
  );
}

export function ContinuousSlideList({ items }: ContinuousSlideListProps) {
  const { currentPresentationId, currentPlaylistPresentationId } = useNavigation();
  const { currentSlideIndex, liveSlideIndex, focusPresentationSlide } = useSlides();
  const { setSlideBrowserMode } = useSlideBrowser();
  const { slideElementsBySlideId } = useProjectContent();

  const handleSelectSlide = useCallback((presentationId: Id, slideIndex: number) => {
    focusPresentationSlide(presentationId, slideIndex);
  }, [focusPresentationSlide]);

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
        currentPlaylistPresentationId={currentPlaylistPresentationId}
        currentSlideIndex={currentSlideIndex}
        liveSlideIndex={liveSlideIndex}
        slideElementsById={slideElementsBySlideId}
        onSelectSlide={handleSelectSlide}
        onOpenSlide={handleOpenSlide}
      />
    );
  }, [currentPlaylistPresentationId, currentPresentationId, currentSlideIndex, handleOpenSlide, handleSelectSlide, liveSlideIndex, slideElementsBySlideId]);

  if (items.length === 0) {
    return (
      <section className="grid h-full min-h-0 place-items-center text-[12px] text-text-tertiary">
        No playlist presentations available.
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-y-auto p-2">
      <div className="grid content-start gap-5" role="list" aria-label="Continuous playlist outline">
        {items.map(renderSection)}
      </div>
    </section>
  );
}

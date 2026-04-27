import { useNavigation } from '../../contexts/navigation-context';
import { useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useSlides } from '../../contexts/slide-context';
import { EmptyState } from '../../components/display/empty-state';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { ScrollArea } from '../../components/layout/scroll-area';
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import { useDeckBrowser } from './deck-browser-context';
import { SlideGridTile } from './slide-grid-tile';
import { SlideOutlineRow } from './slide-list-row';
import { useOutlineView } from './use-slide-list-view';
import type { SlideBrowserContentVariant } from './use-deck-browser-view';

interface SlideBrowserContentProps {
  variant: SlideBrowserContentVariant;
}

export function SlideBrowserContent({ variant }: SlideBrowserContentProps) {
  if (variant !== 'single-grid' && variant !== 'single-list') return null;
  return variant === 'single-grid' ? <SingleSlideGrid /> : <SingleSlideList />;
}

function SingleSlideGrid() {
  const { currentDeckItemId, currentOutputDeckItemId, isDetachedDeckBrowser } = useNavigation();
  const { slides, currentSlideIndex, liveSlideIndex, slideElementsById, activateSlide, setCurrentSlideIndex } = useSlides();
  const { getThumbnailScene } = useRenderScenes();
  const { gridItemSize } = useDeckBrowser();
  const showLiveState = !isDetachedDeckBrowser && currentDeckItemId === currentOutputDeckItemId;

  return (
    <ScrollArea className="p-2">
      <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label="Slides">
        {slides.map((slide, idx) => {
          const elements = slideElementsById.get(slide.id) ?? [];
          const scene = getThumbnailScene(slide.id, 'show');
          if (!scene) return null;
          const state = getSlideVisualState(idx, showLiveState ? liveSlideIndex : -1, currentSlideIndex, elements);

          return (
            <SlideGridTile
              key={slide.id}
              slideId={slide.id}
              index={idx}
              scene={scene}
              selected={idx === currentSlideIndex}
              isLive={state === 'live'}
              isEmpty={state === 'warning'}
              textPreview={slideTextPreview(elements)}
              onActivate={activateSlide}
              onFocus={setCurrentSlideIndex}
            />
          );
        })}
      </ThumbnailGrid>
    </ScrollArea>
  );
}

function SingleSlideList() {
  const { rows, currentSlideIndex, selectSlide, openSlide, updateText } = useOutlineView();
  const { getThumbnailScene } = useRenderScenes();

  function renderRow(row: (typeof rows)[number]) {
    const scene = getThumbnailScene(row.slide.id, 'list');
    if (!scene) return null;
    return (
      <SlideOutlineRow
        key={row.slide.id}
        row={row}
        scene={scene}
        isFocused={row.index === currentSlideIndex}
        onSelect={selectSlide}
        onOpen={openSlide}
        onTextCommit={updateText}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Title>No slides available.</EmptyState.Title>
      </EmptyState.Root>
    );
  }

  return (
    <ScrollArea className="p-2">
      <div className="flex flex-col gap-3" role="list" aria-label="Slide outline">
        {rows.map(renderRow)}
      </div>
    </ScrollArea>
  );
}

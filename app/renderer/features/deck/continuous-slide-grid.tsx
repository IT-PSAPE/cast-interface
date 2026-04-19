import type { Id, Slide, SlideElement } from '@core/types';
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import type { PlaylistDeckSequenceItem } from './use-playlist-deck-sequence';
import { useRenderScenes } from '../../contexts/canvas/canvas-context';
import { useDeckBrowser } from './deck-browser-context';
import { useContinuousSlideSections } from './use-continuous-slide-sections';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { EmptyState } from '../../components/display/empty-state';
import { ContinuousSlideGridTile } from './continuous-slide-grid-tile';
import type { RenderScene, SceneSurface } from '../canvas/scene-types';

interface ContinuousSlideGridProps {
  items: PlaylistDeckSequenceItem[];
}

interface GridSectionProps {
  item: PlaylistDeckSequenceItem;
  currentPlaylistEntryId: Id | null;
  currentOutputPlaylistEntryId: Id | null;
  currentSlideIndex: number;
  gridItemSize: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  getThumbnailScene: (slideId: Id, surface: SceneSurface) => RenderScene | null;
  onActivateSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
  onEditSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
}

function GridSection({ item, currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, gridItemSize, liveSlideIndex, slideElementsById, getThumbnailScene, onActivateSlide, onEditSlide }: GridSectionProps) {
  const isCurrentPresentation = item.entryId === currentPlaylistEntryId;
  const isLivePresentation = item.entryId === currentOutputPlaylistEntryId;

  function renderSlideCard(slide: Slide, index: number) {
    const elements = slideElementsById.get(slide.id) ?? [];
    const state = getSlideVisualState(index, isLivePresentation ? liveSlideIndex : -1, isCurrentPresentation ? currentSlideIndex : -1, elements);
    const scene = getThumbnailScene(slide.id, 'list');
    if (!scene) return null;

    return (
      <ContinuousSlideGridTile
        key={slide.id}
        entryId={item.entryId}
        itemId={item.item.id}
        index={index}
        scene={scene}
        selected={isCurrentPresentation && index === currentSlideIndex}
        isLive={state === 'live'}
        isEmpty={state === 'warning'}
        textPreview={slideTextPreview(elements)}
        onActivate={onActivateSlide}
        onEdit={onEditSlide}
      />
    );
  }

  return (
    <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label={`${item.item.title} slides`}>
      {item.slides.map(renderSlideCard)}
    </ThumbnailGrid>
  );
}

export function ContinuousSlideGrid({ items }: ContinuousSlideGridProps) {
  const { currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, liveSlideIndex, slideElementsBySlideId, handleActivateSlide, handleEditSlide } = useContinuousSlideSections();
  const { gridItemSize } = useDeckBrowser();
  const { getThumbnailScene } = useRenderScenes();

  if (items.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Title>No playlist items available.</EmptyState.Title>
      </EmptyState.Root>
    );
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <div className="flex flex-col gap-2" role="list" aria-label="Continuous playlist grid">
        {items.map((item) => (
          <GridSection
            key={item.entryId}
            item={item}
            currentPlaylistEntryId={currentPlaylistEntryId}
            currentOutputPlaylistEntryId={currentOutputPlaylistEntryId}
            currentSlideIndex={currentSlideIndex}
            gridItemSize={gridItemSize}
            liveSlideIndex={liveSlideIndex}
            slideElementsById={slideElementsBySlideId}
            getThumbnailScene={getThumbnailScene}
            onActivateSlide={handleActivateSlide}
            onEditSlide={handleEditSlide}
          />
        ))}
      </div>
    </section>
  );
}

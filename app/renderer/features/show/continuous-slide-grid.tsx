import { useCallback } from 'react';
import type { Id, Slide, SlideElement } from '@core/types';
import { getSlideVisualState, slideTextPreview } from '../../utils/slides';
import type { PlaylistPresentationSequenceItem } from './use-playlist-presentation-sequence';
import { buildThumbnailScene } from '../stage/build-render-scene';
import { useSlideBrowser } from './slide-browser-context';
import { useContinuousSlideSections } from './use-continuous-slide-sections';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { SceneFrame } from '@renderer/components/display/scene-frame';
import { SceneStage } from '../stage/scene-stage';
import { Play } from 'lucide-react';
import { Thumbnail } from '@renderer/components/display/thumbnail';

interface ContinuousSlideGridProps {
  items: PlaylistPresentationSequenceItem[];
}

interface GridSectionProps {
  item: PlaylistPresentationSequenceItem;
  currentPlaylistEntryId: Id | null;
  currentOutputPlaylistEntryId: Id | null;
  currentSlideIndex: number;
  gridItemSize: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  onActivateSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
  onEditSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
}

function GridSection({ item, currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, gridItemSize, liveSlideIndex, slideElementsById, onActivateSlide, onEditSlide }: GridSectionProps) {
  const isCurrentPresentation = item.entryId === currentPlaylistEntryId;
  const isLivePresentation = item.entryId === currentOutputPlaylistEntryId;

  const renderSlideCard = useCallback((slide: Slide, index: number) => {
    const elements = slideElementsById.get(slide.id) ?? [];
    const state = getSlideVisualState(index, isLivePresentation ? liveSlideIndex : -1, isCurrentPresentation ? currentSlideIndex : -1, elements);
    const scene = buildThumbnailScene(slide, elements);

    function handleActivate() {
      onActivateSlide(item.entryId, item.item.id, index);
    }

    function handleEdit() {
      onEditSlide(item.entryId, item.item.id, index);
    }

    const isLive = state === 'live';
    const isEmpty = state === 'warning';

    return (
      <Thumbnail.Tile
        key={slide.id}
        onClick={handleActivate}
        onDoubleClick={handleEdit}
        selected={isCurrentPresentation && index === currentSlideIndex}
      >
        <Thumbnail.Body>
          <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
            {isEmpty ? (
              <div className="absolute inset-0 z-10 grid place-items-center text-sm uppercase tracking-wider text-tertiary">
                Empty
              </div>
            ) : null}
            <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
          </SceneFrame>
        </Thumbnail.Body>
        {isLive ? (
          <Thumbnail.Overlay position="top-left">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-[2px] bg-brand_solid text-white shadow-sm">
              <Play size={12} strokeWidth={1.9} />
            </span>
          </Thumbnail.Overlay>
        ) : null}
        <Thumbnail.Caption>
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
            <span className="min-w-0 truncate text-sm text-tertiary">{slideTextPreview(elements)}</span>
          </div>
        </Thumbnail.Caption>
      </Thumbnail.Tile>
    );
  }, [currentSlideIndex, isCurrentPresentation, isLivePresentation, item.item.id, liveSlideIndex, onActivateSlide, onEditSlide, slideElementsById]);

  return (
    <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start" role="grid" aria-label={`${item.item.title} slides`}>
      {item.slides.map(renderSlideCard)}
    </ThumbnailGrid>
  );
}

export function ContinuousSlideGrid({ items }: ContinuousSlideGridProps) {
  const { currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, liveSlideIndex, slideElementsBySlideId, handleActivateSlide, handleEditSlide } = useContinuousSlideSections();
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
            currentPlaylistEntryId={currentPlaylistEntryId}
            currentOutputPlaylistEntryId={currentOutputPlaylistEntryId}
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

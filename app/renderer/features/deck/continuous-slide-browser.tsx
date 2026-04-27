import { useCallback } from 'react';
import { isLyricDeckItem } from '@core/deck-items';
import type { Id, Slide, SlideElement } from '@core/types';
import { Label } from '@renderer/components/display/text';
import { EmptyState } from '../../components/display/empty-state';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { ScrollArea } from '../../components/layout/scroll-area';
import { useRenderScenes } from '../../contexts/canvas/canvas-context';
import { getSlideVisualState, slideTextDetails, slideTextPreview } from '../../utils/slides';
import type { RenderScene, SceneSurface } from '../canvas/scene-types';
import { ContinuousSlideGridTile } from './continuous-slide-grid-tile';
import { useContinuousSlideSections } from './use-continuous-slide-sections';
import { useDeckBrowser } from './deck-browser-context';
import type { PlaylistDeckSequenceItem } from './use-playlist-deck-sequence';
import { useSlideOutlineTextEditing } from './use-slide-outline-text-editing';
import type { OutlineSlideRow } from './use-slide-list-view';
import { SlideOutlineRow } from './slide-list-row';
import type { SlideBrowserContentVariant } from './use-deck-browser-view';

interface ContinuousSlideBrowserProps {
  items: PlaylistDeckSequenceItem[];
  variant: SlideBrowserContentVariant;
}

interface ContinuousSectionProps {
  item: PlaylistDeckSequenceItem;
  currentPlaylistEntryId: Id | null;
  currentOutputPlaylistEntryId: Id | null;
  currentSlideIndex: number;
  liveSlideIndex: number;
  slideElementsById: ReadonlyMap<Id, SlideElement[]>;
  getThumbnailScene: (slideId: Id, surface: SceneSurface) => RenderScene | null;
}

interface ContinuousGridSectionProps extends ContinuousSectionProps {
  gridItemSize: number;
  onActivateSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
  onEditSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
}

interface ContinuousListSectionProps extends ContinuousSectionProps {
  onSelectSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
  onOpenSlide: (entryId: Id, itemId: Id, slideIndex: number) => void;
}

export function ContinuousSlideBrowser({ items, variant }: ContinuousSlideBrowserProps) {
  if (variant !== 'continuous-grid' && variant !== 'continuous-list') return null;

  if (items.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Title>No playlist items available.</EmptyState.Title>
      </EmptyState.Root>
    );
  }

  return variant === 'continuous-grid'
    ? <ContinuousSlideGridView items={items} />
    : <ContinuousSlideListView items={items} />;
}

function ContinuousSlideGridView({ items }: { items: PlaylistDeckSequenceItem[] }) {
  const { currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, liveSlideIndex, slideElementsBySlideId, handleActivateSlide, handleEditSlide } = useContinuousSlideSections();
  const { gridItemSize } = useDeckBrowser();
  const { getThumbnailScene } = useRenderScenes();

  return (
    <ScrollArea.Root>
      <ScrollArea.Viewport>
        {items.map((item) => (
          <ContinuousGridSection
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
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

function ContinuousGridSection({ item, currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, gridItemSize, liveSlideIndex, slideElementsById, getThumbnailScene, onActivateSlide, onEditSlide }: ContinuousGridSectionProps) {
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

  const slideCards = item.slides.map(renderSlideCard);
  if (slideCards.every((slideCard) => slideCard === null)) return null;

  return (
    <div className="relative">
      <ContinuousSectionHeader item={item} isCurrent={isCurrentPresentation} />
      <ThumbnailGrid columns={gridItemSize} className="auto-rows-max content-start p-2" role="grid" aria-label={`${item.item.title} slides`}>
        {slideCards}
      </ThumbnailGrid>
    </div>
  );
}

function ContinuousSlideListView({ items }: { items: PlaylistDeckSequenceItem[] }) {
  const { currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, liveSlideIndex, slideElementsBySlideId, handleActivateSlide, handleEditSlide } = useContinuousSlideSections();
  const { getThumbnailScene } = useRenderScenes();

  return (
    <ScrollArea.Root>
      <ScrollArea.Viewport>
        {items.map((item) => (
          <ContinuousListSection
            key={item.entryId}
            item={item}
            currentPlaylistEntryId={currentPlaylistEntryId}
            currentOutputPlaylistEntryId={currentOutputPlaylistEntryId}
            currentSlideIndex={currentSlideIndex}
            liveSlideIndex={liveSlideIndex}
            slideElementsById={slideElementsBySlideId}
            getThumbnailScene={getThumbnailScene}
            onSelectSlide={handleActivateSlide}
            onOpenSlide={handleEditSlide}
          />
        ))}
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

function ContinuousListSection({ item, currentPlaylistEntryId, currentOutputPlaylistEntryId, currentSlideIndex, liveSlideIndex, slideElementsById, getThumbnailScene, onSelectSlide, onOpenSlide }: ContinuousListSectionProps) {
  const { updateText } = useSlideOutlineTextEditing();
  const isCurrentPresentation = item.entryId === currentPlaylistEntryId;
  const isLivePresentation = item.entryId === currentOutputPlaylistEntryId;
  const textEditable = isLyricDeckItem(item.item);

  const renderRow = useCallback((slide: Slide, index: number) => {
    const elements = slideElementsById.get(slide.id) ?? [];
    const details = slideTextDetails(elements);
    const scene = getThumbnailScene(slide.id, 'list');
    if (!scene) return null;
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
      onSelectSlide(item.entryId, item.item.id, index);
    }

    function handleOpen() {
      onOpenSlide(item.entryId, item.item.id, index);
    }

    function handleTextCommit(_slideId: Id, nextText: string) {
      updateText({ elements: row.elements, nextText, slideIndex: row.index, textEditable: row.textEditable, textElementId: row.textElementId });
    }

    return (
      <SlideOutlineRow key={slide.id} row={row} scene={scene} isFocused={isCurrentPresentation && index === currentSlideIndex} onSelect={handleSelect} onOpen={handleOpen} onTextCommit={handleTextCommit} />
    );
  }, [currentSlideIndex, isCurrentPresentation, isLivePresentation, item.entryId, item.item.id, liveSlideIndex, onOpenSlide, onSelectSlide, slideElementsById, textEditable, updateText]);

  const rows = item.slides.map(renderRow);
  if (rows.every((row) => row === null)) return null;

  return (
    <section className="relative" role="listitem" aria-label={`${item.item.title} slide group`}>
      <ContinuousSectionHeader item={item} isCurrent={isCurrentPresentation} isLive={isLivePresentation} />
      <div className="flex flex-col gap-2 p-2" role="list" aria-label={`${item.item.title} outline`}>
        {rows}
      </div>
    </section>
  );
}

function ContinuousSectionHeader({ item, isCurrent, isLive = false }: { item: PlaylistDeckSequenceItem; isCurrent: boolean; isLive?: boolean }) {
  return (
    <div className="sticky top-0 z-10 flex h-9 w-full items-center gap-2 border-b border-primary bg-tertiary px-2 py-1">
      <div className="flex min-w-0 items-center gap-2">
        <Label.xs className="mr-auto truncate font-medium text-primary">{item.item.title}</Label.xs>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {isCurrent ? <span className="rounded-sm bg-brand_solid/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand_solid">Current</span> : null}
          {isLive ? <span className="rounded-sm bg-error_primary/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-error">Live</span> : null}
        </div>
      </div>
    </div>
  );
}

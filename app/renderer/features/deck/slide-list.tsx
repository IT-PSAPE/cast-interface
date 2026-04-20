import { useOutlineView } from './use-slide-list-view';
import { useRenderScenes } from '../../contexts/canvas/canvas-context';
import { SlideOutlineRow } from './slide-list-row';
import { EmptyState } from '../../components/display/empty-state';
import { ScrollArea } from '../../components/layout/scroll-area';

export function SlideList() {
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

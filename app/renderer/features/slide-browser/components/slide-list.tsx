import { useOutlineView } from '../hooks/use-slide-list-view';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import { SlideOutlineRow } from './slide-list-row';

export function SlideList() {
  const { rows, currentSlideIndex, selectSlide, openSlide, updatePrimaryText } = useOutlineView();
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
        onPrimaryTextCommit={updatePrimaryText}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <section className="grid h-full min-h-0 place-items-center text-sm text-text-tertiary">
        No slides available.
      </section>
    );
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto p-2">
      <div className="grid content-start gap-2" role="list" aria-label="Slide outline">
        {rows.map(renderRow)}
      </div>
    </section>
  );
}

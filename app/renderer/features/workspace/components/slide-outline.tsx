import { useOutlineView } from '../hooks/use-outline-view';
import { useRenderScenes } from '../rendering/render-scene-provider';
import { SlideOutlineRow } from './slide-outline-row';

export function SlideOutline() {
  const { rows, currentSlideIndex, selectSlide, openSlide, updatePrimaryText } = useOutlineView();
  const { getThumbnailScene } = useRenderScenes();

  function renderRow(row: (typeof rows)[number]) {
    const scene = getThumbnailScene(row.slide.id, 'outline');
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
      <section className="grid h-full min-h-0 place-items-center text-[12px] text-text-muted">
        No slides available.
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-y-auto p-2">
      <div className="grid content-start gap-2" role="list" aria-label="Slide outline">
        {rows.map(renderRow)}
      </div>
    </section>
  );
}

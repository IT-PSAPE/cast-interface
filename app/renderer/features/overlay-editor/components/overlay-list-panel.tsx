import { Button } from '../../../components/button';
import { SceneFrame } from '../../../components/scene-frame';
import { ThumbnailTile } from '../../../components/thumbnail-tile';
import { useOverlayEditor } from '../../../contexts/overlay-editor-context';
import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneStage } from '../../stage/rendering/scene-stage';
import { overlayToLayerElements } from '@core/presentation-layers';
import { ObjectListPanel } from '../../slide-editor/components/object-list-panel';

export function OverlayListPanel() {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay } = useOverlayEditor();

  function handleAddOverlay() {
    void createOverlay();
  }

  function renderOverlayCard(overlay: (typeof overlays)[number], index: number) {
    const scene = buildRenderScene(null, overlayToLayerElements(overlay));
    const isFocused = currentOverlayId === overlay.id;
    const outlineClass = isFocused ? 'ring-1 ring-focus ring-offset-1 ring-offset-surface-0' : '';

    function handleSelectOverlay() {
      setCurrentOverlayId(overlay.id);
    }

    return (
      <ThumbnailTile
        key={overlay.id}
        onClick={handleSelectOverlay}
        selected={isFocused}
        className={outlineClass}
        body={(
          <SceneFrame width={scene.width} height={scene.height} className="bg-thumb-bg" stageClassName="absolute inset-0">
            <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
          </SceneFrame>
        )}
        caption={(
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-text-secondary">{index + 1}</span>
            <span className="truncate text-[11px] text-text-muted">{overlay.name}</span>
          </div>
        )}
      />
    );
  }

  return (
    <aside className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_minmax(0,240px)] overflow-hidden border-r border-stroke bg-surface-1">
      <header className="flex h-8 items-center gap-2 border-b border-stroke px-2">
        <span className="truncate text-[12px] font-medium text-text-primary">Overlays</span>
        <Button onClick={handleAddOverlay} className="ml-auto grid h-6 w-6 place-items-center p-0 text-[14px] leading-none">
          <span aria-hidden="true">+</span>
          <span className="sr-only">Add overlay</span>
        </Button>
      </header>

      <div className="min-h-0 overflow-y-auto p-2">
        <div className="grid content-start gap-2" role="grid" aria-label="Library overlays">
          {overlays.map(renderOverlayCard)}
        </div>
      </div>

      <header className="flex h-8 items-center border-y border-stroke px-2">
        <span className="text-[12px] font-medium text-text-primary">Objects</span>
      </header>

      <div className="min-h-0 overflow-y-auto p-2">
        <ObjectListPanel />
      </div>
    </aside>
  );
}

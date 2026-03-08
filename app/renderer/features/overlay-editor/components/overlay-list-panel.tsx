import { Button } from '../../../components/button';
import { PanelSection } from '../../../components/panel-section';
import { TwoPaneVerticalSplit } from '../../../components/resizable-split';
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
    const outlineClass = isFocused ? 'ring-1 ring-brand-400 ring-offset-1 ring-offset-background-primary' : '';

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
          <SceneFrame width={scene.width} height={scene.height} className="bg-background-tertiary" stageClassName="absolute inset-0">
            <SceneStage scene={scene} className="absolute inset-0 pointer-events-none" />
          </SceneFrame>
        )}
        caption={(
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-text-secondary">{index + 1}</span>
            <span className="truncate text-[11px] text-text-tertiary">{overlay.name}</span>
          </div>
        )}
      />
    );
  }

  return (
    <aside
      data-ui-region="overlay-list-panel"
      className="h-full min-h-0 overflow-hidden border-r border-border-primary bg-background-primary_alt"
    >
      <TwoPaneVerticalSplit
        className="h-full"
        topPaneId="overlay-list"
        bottomPaneId="overlay-objects"
        defaultTopSize={440}
        defaultBottomSize={220}
        minTopSize={180}
        minBottomSize={160}
        topPane={(
          <PanelSection
            title={<span className="truncate text-[12px] font-medium text-text-primary">Overlays</span>}
            action={(
              <Button onClick={handleAddOverlay} className="grid h-6 w-6 place-items-center p-0 text-[14px] leading-none">
                <span aria-hidden="true">+</span>
                <span className="sr-only">Add overlay</span>
              </Button>
            )}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-2" role="grid" aria-label="Library overlays">
              {overlays.map(renderOverlayCard)}
            </div>
          </PanelSection>
        )}
        bottomPane={(
          <PanelSection
            title={<span className="text-[12px] font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        )}
      />
    </aside>
  );
}

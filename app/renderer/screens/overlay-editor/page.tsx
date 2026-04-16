import type { Id } from '@core/types';
import { overlayToLayerElements } from '@core/presentation-layers';
import { Ellipsis, Trash2 } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { Panel } from '../../components/layout/panel';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { useOverlayEditor } from '../../contexts/overlay-editor/overlay-editor-context';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { ItemListPanel } from '../../features/editor/item-list-panel';
import { InspectorTabsPanel } from '../../features/inspector/inspector-tabs-panel';
import { useInspectorPanelPushAction } from '../../features/inspector/use-inspector-panel-push-action';
import { buildRenderScene } from '../../features/stage/build-render-scene';
import { StagePanel } from '../../features/stage/stage-panel';
import { PanelRoute } from '../../features/workbench/panel-route';

export function OverlayEditorScreen() {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay, deleteCurrentOverlay } = useOverlayEditor();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const menu = useContextMenuState<Id>();

  function handleAddOverlay() {
    void createOverlay();
  }

  function handleDeleteOverlay(overlayId: Id) {
    if (!window.confirm('Delete this overlay? This cannot be undone.')) return;
    setCurrentOverlayId(overlayId);
    void deleteCurrentOverlay();
  }

  function buildMenuItems(overlayId: Id): ContextMenuItem[] {
    return [
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteOverlay(overlayId) },
    ];
  }

  return (
    <section data-ui-region="editor-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="editor-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="editor-left" defaultSize={280} minSize={140} collapsible>
          <ItemListPanel
            title="Overlays"
            splitId="overlay-list-panel"
            listPanelId="overlay-list"
            objectsPanelId="overlay-objects"
            onAdd={handleAddOverlay}
            addLabel="Add overlay"
            listAriaLabel="Library overlays"
          >
            {overlays.map((overlay, index) => {
              const scene = buildRenderScene(null, overlayToLayerElements(overlay));

              function handleSelect() {
                setCurrentOverlayId(overlay.id);
              }

              function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
                event.stopPropagation();
                menu.openFromButton(event.currentTarget, overlay.id);
              }

              return (
                <SceneThumbnailCard
                  key={overlay.id}
                  scene={scene}
                  index={index}
                  label={overlay.name}
                  secondaryText={overlay.name}
                  selected={currentOverlayId === overlay.id}
                  onClick={handleSelect}
                  menuButton={(
                    <Button.Icon label="Overlay options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
                      <Ellipsis />
                    </Button.Icon>
                  )}
                />
              );
            })}
            {menu.menuState ? <ContextMenu x={menu.menuState.x} y={menu.menuState.y} items={buildMenuItems(menu.menuState.data)} onClose={menu.close} /> : null}
          </ItemListPanel>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="editor-center" defaultSize={840} minSize={360}>
          <StagePanel />
        </PanelRoute.Panel>
        <PanelRoute.Panel id="editor-right" defaultSize={320} minSize={140} collapsible>
          <Panel as="aside" bordered="left" data-ui-region="inspector-panel">
            <InspectorTabsPanel className="flex-1" />
            {inspectorState.isVisible ? (
              <Panel.Footer className="p-3">
                <Button onClick={handlePushChanges} disabled={inspectorState.isPushingChanges} className="w-full">
                  {inspectorState.isPushingChanges ? 'Pushing…' : inspectorState.pushLabel}
                </Button>
              </Panel.Footer>
            ) : null}
          </Panel>
        </PanelRoute.Panel>
      </PanelRoute.Split>
    </section>
  );
}

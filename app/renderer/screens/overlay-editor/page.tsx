import type { Id } from '@core/types';
import { overlayToLayerElements } from '@core/presentation-layers';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { RecastPanel } from '@renderer/components 2.0/panel';
import { Thumbnail } from '../../components/display/thumbnail';
import { SceneFrame } from '../../components/display/scene-frame';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { useOverlayEditor } from '../../contexts/asset-editor/asset-editor-context';
import { ObjectListPanel } from '../../features/canvas/object-list-panel';
import { InspectorTabsPanel } from '../../features/canvas/inspector-tabs-panel';
import { useInspectorPanelPushAction } from '../../features/canvas/use-inspector-panel-push-action';
import { buildRenderScene } from '../../features/canvas/build-render-scene';
import { SceneStage } from '../../features/canvas/scene-stage';
import { StagePanel } from '../../features/canvas/stage-panel';
import { SplitPanel } from '../../features/workbench/split-panel';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { Label } from '@renderer/components/display/text';
import { EmptyState } from '@renderer/components/display/empty-state';
import { ScrollArea, useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';

export function OverlayEditorScreen() {
  const { overlays, currentOverlayId, setCurrentOverlayId, createOverlay, deleteCurrentOverlay, duplicateOverlay, requestNameFocus } = useOverlayEditor();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();

  useEditorLeftPanelNav({
    items: overlays,
    currentId: currentOverlayId,
    activate: (id) => setCurrentOverlayId(id),
  });

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
      { id: 'rename', label: 'Rename', icon: <Pencil size={14} />, onSelect: () => requestNameFocus(overlayId) },
      { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} />, onSelect: () => duplicateOverlay(overlayId) },
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteOverlay(overlayId) },
    ];
  }

  return (
    <section data-ui-region="editor-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="editor-main" orientation="horizontal" className="h-full">
        <SplitPanel.Segment id="editor-left" defaultSize={280} minSize={140} collapsible>
          <RecastPanel.Root className="h-full border-r border-secondary">
            <SplitPanel.Panel splitId="overlay-list-panel" orientation="vertical" className="h-full">
              <SplitPanel.Segment id="overlay-list" defaultSize={440} minSize={180}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle>
                    <div className="mr-auto">
                      <Label.sm>Overlays</Label.sm>
                    </div>
                    <div>
                      <ReacstButton.Icon label="Add overlay" onClick={handleAddOverlay}>
                        <Plus />
                      </ReacstButton.Icon>
                    </div>
                  </RecastPanel.GroupTitle>
                  <RecastPanel.Content>
                    {overlays.length === 0 ? (
                      <EmptyState.Root>
                        <EmptyState.Title>No overlays yet</EmptyState.Title>
                        <EmptyState.Description>Click the + button to create your first overlay.</EmptyState.Description>
                      </EmptyState.Root>
                    ) : (
                    <ScrollArea className="p-2">
                    <div className="grid min-w-0 grid-cols-1 content-start gap-1" role="grid" aria-label="Library overlays">
                      {overlays.map((overlay, index) => {
                        const scene = buildRenderScene(null, overlayToLayerElements(overlay));

                        function handleSelect() {
                          setCurrentOverlayId(overlay.id);
                        }

                        return (
                          <ContextMenu.Root key={overlay.id}>
                            <ContextMenu.Trigger>
                              <ActiveOverlayTile isActive={currentOverlayId === overlay.id} onClick={handleSelect} selected={currentOverlayId === overlay.id}>
                                <Thumbnail.Body>
                                  <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
                                    <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
                                  </SceneFrame>
                                </Thumbnail.Body>
                                <Thumbnail.Caption>
                                  <div className="flex items-center gap-2">
                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
                                    <span className="min-w-0 truncate text-sm text-tertiary">{overlay.name}</span>
                                  </div>
                                </Thumbnail.Caption>
                              </ActiveOverlayTile>
                            </ContextMenu.Trigger>
                            <ContextMenu.Portal>
                              <ContextMenu.Positioner>
                                <ContextMenu.Popup>
                                  <ContextMenu.Items items={buildMenuItems(overlay.id)} />
                                </ContextMenu.Popup>
                              </ContextMenu.Positioner>
                            </ContextMenu.Portal>
                          </ContextMenu.Root>
                        );
                      })}
                      </div>
                    </ScrollArea>
                    )}
                  </RecastPanel.Content>
                </RecastPanel.Group>
              </SplitPanel.Segment>
              <SplitPanel.Segment id="overlay-objects" defaultSize={220} minSize={160}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle className="border-t">
                    <div className="mr-auto">
                      <span className="text-sm font-medium text-primary">Objects</span>
                    </div>
                  </RecastPanel.GroupTitle>
                  <RecastPanel.Content className="overflow-y-auto p-2">
                    <ObjectListPanel />
                  </RecastPanel.Content>
                </RecastPanel.Group>
              </SplitPanel.Segment>
            </SplitPanel.Panel>
          </RecastPanel.Root>
        </SplitPanel.Segment>
        <SplitPanel.Segment id="editor-center" defaultSize={840} minSize={360}>
          <StagePanel />
        </SplitPanel.Segment>
        <SplitPanel.Segment id="editor-right" defaultSize={320} minSize={140} collapsible>
          <RecastPanel.Root className="h-full border-l border-secondary" data-ui-region="inspector-panel">
            <InspectorTabsPanel className="flex-1" />
            {inspectorState.isVisible && (
              <RecastPanel.Footer className="p-3">
                <ReacstButton onClick={handlePushChanges} disabled={inspectorState.isPushingChanges} className="w-full">
                  {inspectorState.isPushingChanges ? 'Pushing…' : inspectorState.pushLabel}
                </ReacstButton>
              </RecastPanel.Footer>
            )}
          </RecastPanel.Root>
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}

function ActiveOverlayTile({ isActive, ...props }: React.ComponentProps<typeof Thumbnail.Tile> & { isActive: boolean }) {
  const ref = useScrollAreaActiveItem(isActive);
  return <Thumbnail.Tile ref={ref} {...props} />;
}

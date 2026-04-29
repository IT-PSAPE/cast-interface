import { overlayToLayerElements } from '@core/presentation-layers';
import { Plus } from 'lucide-react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { RecastPanel } from '@renderer/components 2.0/panel';
import { Thumbnail } from '../../components/display/thumbnail';
import { SceneFrame } from '../../components/display/scene-frame';
import { Dropdown } from '../../components/form/dropdown';
import { ObjectListPanel } from '../../features/canvas/object-list-panel';
import { InspectorTabsPanel } from '../../features/canvas/inspector-tabs-panel';
import { buildRenderScene } from '../../features/canvas/build-render-scene';
import { SceneStage } from '../../features/canvas/scene-stage';
import { StagePanel } from '../../features/canvas/stage-panel';
import { SplitPanel } from '../../features/workbench/split-panel';
import { Label } from '@renderer/components/display/text';
import { EmptyState } from '@renderer/components/display/empty-state';
import { ScrollArea, useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';
import { OverlayEditorScreenProvider, useOverlayEditorScreen } from './screen-context';

export function OverlayEditorScreen() {
  return (
    <OverlayEditorScreenProvider>
      <OverlayEditorScreenContent />
    </OverlayEditorScreenProvider>
  );
}

function OverlayEditorScreenContent() {
  const { meta, state, actions } = useOverlayEditorScreen();

  return (
    <section data-ui-region="editor-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="editor-main" orientation="horizontal" className="h-full">
        <SplitPanel.Segment id="editor-left" defaultSize={280} minSize={140} collapsible>
          <RecastPanel.Root className="h-full border-r border-secondary">
            <SplitPanel.Panel splitId="overlay-list-panel" orientation="vertical" className="h-full">
              <SplitPanel.Segment id="overlay-list" defaultSize={440} minSize={180}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle>
                    <Label.sm className="mr-auto">{meta.listTitle}</Label.sm>
                    <Dropdown>
                      <Dropdown.Trigger
                        aria-label="Add"
                        className="cursor-pointer rounded-sm bg-tertiary p-1 text-primary transition-colors hover:text-primary [&>svg]:size-4"
                      >
                        <Plus />
                      </Dropdown.Trigger>
                      <Dropdown.Panel placement="bottom-end">
                        {meta.addActions.map((action) => (
                          <Dropdown.Item key={action.kind} onClick={() => { void actions.createOverlay(); }}>
                            {action.label}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Panel>
                    </Dropdown>
                  </RecastPanel.GroupTitle>
                  <RecastPanel.Content>
                    {state.overlays.length === 0 ? (
                      <EmptyState.Root>
                        <EmptyState.Title>No overlays yet</EmptyState.Title>
                        <EmptyState.Description>Click the + button to create your first overlay.</EmptyState.Description>
                      </EmptyState.Root>
                    ) : (
                      <ScrollArea.Root>
                        <ScrollArea.Viewport className="p-2">
                          <div className="grid min-w-0 grid-cols-1 content-start gap-1" role="grid" aria-label="Library overlays">
                            {state.overlays.map((overlay, index) => {
                              const scene = buildRenderScene(null, overlayToLayerElements(overlay));

                              function handleSelect() {
                                actions.selectOverlay(overlay.id);
                              }

                              return (
                                <ActiveOverlayTile key={overlay.id} isActive={state.currentOverlayId === overlay.id} onClick={handleSelect} selected={state.currentOverlayId === overlay.id}>
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
                              );
                            })}
                          </div>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar>
                          <ScrollArea.Thumb />
                        </ScrollArea.Scrollbar>
                      </ScrollArea.Root>
                    )}
                  </RecastPanel.Content>
                </RecastPanel.Group>
              </SplitPanel.Segment>
              <SplitPanel.Segment id="overlay-objects" defaultSize={220} minSize={160}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle className="border-t">
                    <Label.xs className="mr-auto">Layers</Label.xs>
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
            {state.inspectorState.isVisible && (
              <RecastPanel.Footer className="p-3">
                <ReacstButton onClick={actions.pushChanges} disabled={state.inspectorState.isPushingChanges} className="w-full">
                  {state.inspectorState.isPushingChanges ? 'Pushing…' : state.inspectorState.pushLabel}
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

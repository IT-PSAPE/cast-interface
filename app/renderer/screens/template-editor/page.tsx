import { useState } from 'react';
import type { Template } from '@core/types';
import { Layers, Music, Plus, Presentation } from 'lucide-react';
import { ReacstButton } from '@renderer/components 2.0/button';
import { RecastPanel } from '@renderer/components 2.0/panel';
import { SceneFrame } from '../../components/display/scene-frame';
import { Thumbnail } from '../../components/display/thumbnail';
import { Dropdown } from '../../components/form/dropdown';
import { useCreateDeckItem } from '../../features/deck/create-deck-item';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { isTemplateCompatibleWithDeckItem } from '@core/templates';
import { ObjectListPanel } from '../../features/canvas/object-list-panel';
import { InspectorTabsPanel } from '../../features/canvas/inspector-tabs-panel';
import { buildRenderScene } from '../../features/canvas/build-render-scene';
import { SceneStage } from '../../features/canvas/scene-stage';
import { StagePanel } from '../../features/canvas/stage-panel';
import { SplitPanel } from '../../features/workbench/split-panel';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { EmptyState } from '@renderer/components/display/empty-state';
import { Label } from '@renderer/components/display/text';
import { ScrollArea, useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';

export function TemplateEditorScreen() {
  const { templates, currentTemplateId, currentTemplate, hasPendingChanges: hasTemplateDraftChanges, openTemplateEditor, requestNameFocus, syncLinkedDeckItems, createTemplate } = useTemplateEditor();
  const { open: openCreateDeckItem } = useCreateDeckItem();
  const { deckItems } = useProjectContent();

  const linkedItemCount = currentTemplate
    ? deckItems.filter((item) => item.templateId === currentTemplate.id && isTemplateCompatibleWithDeckItem(currentTemplate, item.type)).length
    : 0;
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSyncLinkedItems() {
    if (!currentTemplate || linkedItemCount === 0) return;
    setIsSyncing(true);
    try {
      await syncLinkedDeckItems(currentTemplate.id);
    } finally {
      setIsSyncing(false);
    }
  }

  useEditorLeftPanelNav({
    items: templates,
    currentId: currentTemplateId,
    activate: (id) => openTemplateEditor(id),
  });

  return (
    <section data-ui-region="editor-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="editor-main" orientation="horizontal" className="h-full">
        <SplitPanel.Segment id="editor-left" defaultSize={280} minSize={140} collapsible>
          <RecastPanel.Root className="h-full border-r border-secondary">
            <SplitPanel.Panel splitId="template-list-panel" orientation="vertical" className="h-full">
              <SplitPanel.Segment id="template-list" defaultSize={440} minSize={180}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle>
                    <Label.sm className="mr-auto">Templates</Label.sm>
                    <Dropdown>
                      <Dropdown.Trigger
                        aria-label="Add"
                        className="cursor-pointer rounded-sm bg-tertiary p-1 text-primary transition-colors hover:text-primary [&>svg]:size-4"
                      >
                        <Plus />
                      </Dropdown.Trigger>
                      <Dropdown.Panel placement="bottom-end">
                        <Dropdown.Item onClick={() => openCreateDeckItem('lyric')}>New lyric</Dropdown.Item>
                        <Dropdown.Item onClick={() => openCreateDeckItem('presentation')}>New presentation</Dropdown.Item>
                        <Dropdown.Separator />
                        <Dropdown.Item onClick={() => createTemplate('slides')}>New presentation template</Dropdown.Item>
                        <Dropdown.Item onClick={() => createTemplate('lyrics')}>New lyric template</Dropdown.Item>
                      </Dropdown.Panel>
                    </Dropdown>
                  </RecastPanel.GroupTitle>
                  <RecastPanel.Content>
                    {templates.length === 0 ? (
                      <EmptyState.Root>
                        <EmptyState.Title>No templates yet</EmptyState.Title>
                        <EmptyState.Description>Click the + button to create your first template.</EmptyState.Description>
                      </EmptyState.Root>
                    ) : (
                    <ScrollArea.Root>
                      <ScrollArea.Viewport className="p-2">
                        <div className="grid min-w-0 grid-cols-1 content-start gap-1" role="grid" aria-label="Templates">
                          {templates.map((template, index) => {
                            const scene = buildRenderScene(null, template.elements);

                            function handleSelect() {
                              openTemplateEditor(template.id);
                            }

                            function handleCaptionDoubleClick(event: React.MouseEvent) {
                              event.stopPropagation();
                              requestNameFocus(template.id);
                            }

                            return (
                              <ActiveTemplateTile key={template.id} isActive={template.id === currentTemplateId} onClick={handleSelect} selected={template.id === currentTemplateId}>
                                <Thumbnail.Body>
                                  <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
                                    <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
                                  </SceneFrame>
                                </Thumbnail.Body>
                                <Thumbnail.Caption>
                                  <div className="flex items-center gap-2" onDoubleClick={handleCaptionDoubleClick}>
                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
                                    <TemplateKindIcon kind={template.kind} />
                                    <span className="min-w-0 truncate text-sm text-tertiary">{template.name}</span>
                                  </div>
                                </Thumbnail.Caption>
                              </ActiveTemplateTile>
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
              <SplitPanel.Segment id="template-objects" defaultSize={220} minSize={160}>
                <RecastPanel.Group>
                  <RecastPanel.GroupTitle className="border-t">
                    <Label.xs className="mr-auto">Objects</Label.xs>
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
            {currentTemplate ? (
              <RecastPanel.Footer className="p-3">
                <ReacstButton
                  variant="ghost"
                  onClick={handleSyncLinkedItems}
                  disabled={linkedItemCount === 0 || isSyncing || hasTemplateDraftChanges}
                  title={hasTemplateDraftChanges ? 'Push template changes first' : linkedItemCount === 0 ? 'No deck items use this template' : undefined}
                  className="w-full"
                >
                  {isSyncing ? 'Syncing…' : `Sync ${linkedItemCount} linked ${linkedItemCount === 1 ? 'item' : 'items'}`}
                </ReacstButton>
              </RecastPanel.Footer>
            ) : null}
          </RecastPanel.Root>
        </SplitPanel.Segment>
      </SplitPanel.Panel>
    </section>
  );
}

function ActiveTemplateTile({ isActive, ...props }: React.ComponentProps<typeof Thumbnail.Tile> & { isActive: boolean }) {
  const ref = useScrollAreaActiveItem(isActive);
  return <Thumbnail.Tile ref={ref} {...props} />;
}

function TemplateKindIcon({ kind }: { kind: Template['kind'] }) {
  if (kind === 'lyrics') {
    return <Music size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
  }
  if (kind === 'overlays') {
    return <Layers size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
  }
  return <Presentation size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
}

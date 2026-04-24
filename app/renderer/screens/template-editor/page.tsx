import { useState } from 'react';
import type { Id, Template } from '@core/types';
import { Copy, Ellipsis, Layers, Music, Pencil, Plus, Presentation, Trash2 } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SceneFrame } from '../../components/display/scene-frame';
import { Thumbnail } from '../../components/display/thumbnail';
import { Panel } from '../../components/layout/panel';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useCreateTemplateMenu } from '../../hooks/use-create-template-menu';
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
import { ScrollArea, useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';

export function TemplateEditorScreen() {
  const { templates, currentTemplateId, currentTemplate, hasPendingChanges: hasTemplateDraftChanges, openTemplateEditor, createTemplate, deleteTemplate, duplicateTemplate, requestNameFocus, syncLinkedDeckItems } = useTemplateEditor();
  const { menuItems } = useCreateTemplateMenu({ createTemplate });
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

  function handleDeleteTemplate(templateId: Id) {
    if (!window.confirm('Delete this template? Deck items using it will keep their current elements but lose the template association.')) return;
    deleteTemplate(templateId);
  }

  function buildTemplateMenuItems(templateId: Id): ContextMenuItem[] {
    return [
      { id: 'rename', label: 'Rename', icon: <Pencil size={14} />, onSelect: () => requestNameFocus(templateId) },
      { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} />, onSelect: () => duplicateTemplate(templateId) },
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteTemplate(templateId) },
    ];
  }

  return (
    <section data-ui-region="editor-layout" className="h-full min-h-0 overflow-hidden">
      <SplitPanel.Panel splitId="editor-main" orientation="horizontal" className="h-full">
        <SplitPanel.Segment id="editor-left" defaultSize={280} minSize={140} collapsible>
          <Panel as="aside" bordered="right">
            <SplitPanel.Panel splitId="template-list-panel" orientation="vertical" className="h-full">
              <SplitPanel.Segment id="template-list" defaultSize={440} minSize={180}>
                <Panel.Section>
                  <Panel.SectionHeader className="border-b border-primary">
                    <Panel.SectionTitle>
                      <span className="truncate text-sm font-medium text-primary">Templates</span>
                    </Panel.SectionTitle>
                    <Panel.SectionAction>
                      <ContextMenu.Root>
                        <ContextMenu.ButtonTrigger>
                          <Button.Icon label="Create template">
                            <Plus />
                          </Button.Icon>
                        </ContextMenu.ButtonTrigger>
                        <ContextMenu.Portal>
                          <ContextMenu.Positioner>
                            <ContextMenu.Popup>
                              <ContextMenu.Items items={menuItems} />
                            </ContextMenu.Popup>
                          </ContextMenu.Positioner>
                        </ContextMenu.Portal>
                      </ContextMenu.Root>
                    </Panel.SectionAction>
                  </Panel.SectionHeader>
                  <Panel.SectionBody>
                    {templates.length === 0 ? (
                      <EmptyState.Root>
                        <EmptyState.Title>No templates yet</EmptyState.Title>
                        <EmptyState.Description>Click the + button to create your first template.</EmptyState.Description>
                      </EmptyState.Root>
                    ) : (
                    <ScrollArea className="p-2">
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
                          <ContextMenu.Root key={template.id}>
                            <ContextMenu.Trigger>
                              <ActiveTemplateTile isActive={template.id === currentTemplateId} onClick={handleSelect} selected={template.id === currentTemplateId}>
                                <Thumbnail.Body>
                                  <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
                                    <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
                                  </SceneFrame>
                                </Thumbnail.Body>
                                <Thumbnail.Overlay position="top-right" className="hidden group-hover:block">
                                  <ContextMenu.ButtonTrigger>
                                    <Button.Icon label="Template options" className="border-primary bg-tertiary/80">
                                      <Ellipsis />
                                    </Button.Icon>
                                  </ContextMenu.ButtonTrigger>
                                </Thumbnail.Overlay>
                                <Thumbnail.Caption>
                                  <div className="flex items-center gap-2" onDoubleClick={handleCaptionDoubleClick}>
                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">{index + 1}</span>
                                    <TemplateKindIcon kind={template.kind} />
                                    <span className="min-w-0 truncate text-sm text-tertiary">{template.name}</span>
                                  </div>
                                </Thumbnail.Caption>
                              </ActiveTemplateTile>
                            </ContextMenu.Trigger>
                            <ContextMenu.Portal>
                              <ContextMenu.Positioner>
                                <ContextMenu.Popup>
                                  <ContextMenu.Items items={buildTemplateMenuItems(template.id)} />
                                </ContextMenu.Popup>
                              </ContextMenu.Positioner>
                            </ContextMenu.Portal>
                          </ContextMenu.Root>
                        );
                      })}
                    </div>
                    </ScrollArea>
                    )}
                  </Panel.SectionBody>
                </Panel.Section>
              </SplitPanel.Segment>
              <SplitPanel.Segment id="template-objects" defaultSize={220} minSize={160}>
                <Panel.Section>
                  <Panel.SectionHeader className="border-b border-t border-primary">
                    <Panel.SectionTitle>
                      <span className="text-sm font-medium text-primary">Objects</span>
                    </Panel.SectionTitle>
                  </Panel.SectionHeader>
                  <Panel.SectionBody className="overflow-y-auto p-2">
                    <ObjectListPanel />
                  </Panel.SectionBody>
                </Panel.Section>
              </SplitPanel.Segment>
            </SplitPanel.Panel>
          </Panel>
        </SplitPanel.Segment>
        <SplitPanel.Segment id="editor-center" defaultSize={840} minSize={360}>
          <StagePanel />
        </SplitPanel.Segment>
        <SplitPanel.Segment id="editor-right" defaultSize={320} minSize={140} collapsible>
          <Panel as="aside" bordered="left" data-ui-region="inspector-panel">
            <InspectorTabsPanel className="flex-1" />
            {currentTemplate ? (
              <Panel.Footer className="p-3">
                <Button
                  variant="ghost"
                  onClick={handleSyncLinkedItems}
                  disabled={linkedItemCount === 0 || isSyncing || hasTemplateDraftChanges}
                  title={hasTemplateDraftChanges ? 'Push template changes first' : linkedItemCount === 0 ? 'No deck items use this template' : undefined}
                  className="w-full"
                >
                  {isSyncing ? 'Syncing…' : `Sync ${linkedItemCount} linked ${linkedItemCount === 1 ? 'item' : 'items'}`}
                </Button>
              </Panel.Footer>
            ) : null}
          </Panel>
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

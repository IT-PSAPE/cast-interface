import type { Id, Template } from '@core/types';
import { Copy, Ellipsis, Layers, Music, Pencil, Plus, Presentation, Trash2 } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SceneFrame } from '../../components/display/scene-frame';
import { Thumbnail } from '../../components/display/thumbnail';
import { Panel } from '../../components/layout/panel';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { useTemplateEditor } from '../../contexts/asset-editor/asset-editor-context';
import { useCreateTemplateMenu } from '../../hooks/use-create-template-menu';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { ObjectListPanel } from '../../features/canvas/object-list-panel';
import { InspectorTabsPanel } from '../../features/canvas/inspector-tabs-panel';
import { useInspectorPanelPushAction } from '../../features/canvas/use-inspector-panel-push-action';
import { buildRenderScene } from '../../features/canvas/build-render-scene';
import { SceneStage } from '../../features/canvas/scene-stage';
import { StagePanel } from '../../features/canvas/stage-panel';
import { SplitPanel } from '../../features/workbench/split-panel';
import { useEditorLeftPanelNav } from '../../features/workbench/use-editor-left-panel-nav';
import { EmptyState } from '@renderer/components/display/empty-state';
import { ScrollArea, useScrollAreaActiveItem } from '@renderer/components/layout/scroll-area';

export function TemplateEditorScreen() {
  const { templates, currentTemplateId, openTemplateEditor, createTemplate, deleteTemplate, duplicateTemplate, requestNameFocus } = useTemplateEditor();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreateTemplateMenu({ createTemplate });
  const templateMenu = useContextMenuState<Id>();

  useEditorLeftPanelNav({
    items: templates,
    currentId: currentTemplateId,
    activate: (id) => openTemplateEditor(id),
  });

  function handleOpenCreateMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
  }

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
                      <Button.Icon label="Create template" onClick={handleOpenCreateMenu}>
                        <Plus />
                      </Button.Icon>
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

                        function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
                          event.stopPropagation();
                          templateMenu.openFromButton(event.currentTarget, template.id);
                        }

                        function handleContextMenu(event: React.MouseEvent) {
                          templateMenu.openFromEvent(event, template.id);
                        }

                        function handleCaptionDoubleClick(event: React.MouseEvent) {
                          event.stopPropagation();
                          requestNameFocus(template.id);
                        }

                        return (
                          <ActiveTemplateTile key={template.id} isActive={template.id === currentTemplateId} onClick={handleSelect} onContextMenu={handleContextMenu} selected={template.id === currentTemplateId}>
                            <Thumbnail.Body>
                              <SceneFrame width={scene.width} height={scene.height} className="bg-tertiary" stageClassName="absolute inset-0" checkerboard>
                                <SceneStage scene={scene} surface="list" className="absolute inset-0 pointer-events-none" />
                              </SceneFrame>
                            </Thumbnail.Body>
                            <Thumbnail.Overlay position="top-right" className="hidden group-hover:block">
                              <Button.Icon label="Template options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
                                <Ellipsis />
                              </Button.Icon>
                            </Thumbnail.Overlay>
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
            {menuState && <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} />}
            {templateMenu.menuState && <ContextMenu x={templateMenu.menuState.x} y={templateMenu.menuState.y} items={buildTemplateMenuItems(templateMenu.menuState.data)} onClose={templateMenu.close} />}
          </Panel>
        </SplitPanel.Segment>
        <SplitPanel.Segment id="editor-center" defaultSize={840} minSize={360}>
          <StagePanel />
        </SplitPanel.Segment>
        <SplitPanel.Segment id="editor-right" defaultSize={320} minSize={140} collapsible>
          <Panel as="aside" bordered="left" data-ui-region="inspector-panel">
            <InspectorTabsPanel className="flex-1" />
            {inspectorState.isVisible && (
              <Panel.Footer className="p-3">
                <Button onClick={handlePushChanges} disabled={inspectorState.isPushingChanges} className="w-full">
                  {inspectorState.isPushingChanges ? 'Pushing…' : inspectorState.pushLabel}
                </Button>
              </Panel.Footer>
            )}
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

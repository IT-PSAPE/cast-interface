import type { Id, Template } from '@core/types';
import { Ellipsis, Layers, Music, Presentation, Trash2 } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { Panel } from '../../components/layout/panel';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { useTemplateEditor } from '../../contexts/template-editor-context';
import { useCreateTemplateMenu } from '../../hooks/use-create-template-menu';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { ItemListPanel } from '../../features/editor/item-list-panel';
import { InspectorTabsPanel } from '../../features/inspector/inspector-tabs-panel';
import { useInspectorPanelPushAction } from '../../features/inspector/use-inspector-panel-push-action';
import { buildRenderScene } from '../../features/stage/build-render-scene';
import { StagePanel } from '../../features/stage/stage-panel';
import { PanelRoute } from '../../features/workbench/panel-route';

export function TemplateEditorScreen() {
  const { templates, currentTemplateId, openTemplateEditor, createTemplate, deleteTemplate } = useTemplateEditor();
  const { state: inspectorState, handlePushChanges } = useInspectorPanelPushAction();
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreateTemplateMenu({ createTemplate });
  const templateMenu = useContextMenuState<Id>();

  function handleOpenCreateMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
  }

  function handleDeleteTemplate(templateId: Id) {
    if (!window.confirm('Delete this template? Deck items using it will keep their current elements but lose the template association.')) return;
    deleteTemplate(templateId);
  }

  function buildTemplateMenuItems(templateId: Id): ContextMenuItem[] {
    return [
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteTemplate(templateId) },
    ];
  }

  return (
    <section data-ui-region="editor-layout" className="h-full min-h-0 overflow-hidden">
      <PanelRoute.Split splitId="editor-main" orientation="horizontal" className="h-full">
        <PanelRoute.Panel id="editor-left" defaultSize={280} minSize={140} collapsible>
          <ItemListPanel
            title="Templates"
            splitId="template-list-panel"
            listPanelId="template-list"
            objectsPanelId="template-objects"
            onAdd={handleOpenCreateMenu}
            addLabel="Create template"
            listAriaLabel="Templates"
            contextMenu={menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
          >
            {templates.map((template, index) => {
              const scene = buildRenderScene(null, template.elements);

              function handleSelect() {
                openTemplateEditor(template.id);
              }

              function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
                event.stopPropagation();
                templateMenu.openFromButton(event.currentTarget, template.id);
              }

              return (
                <SceneThumbnailCard
                  key={template.id}
                  scene={scene}
                  index={index}
                  label={template.name}
                  secondaryText={template.name}
                  selected={template.id === currentTemplateId}
                  onClick={handleSelect}
                  captionIcon={<TemplateKindIcon kind={template.kind} />}
                  menuButton={(
                    <Button.Icon label="Template options" onClick={handleMenuClick} className="border-primary bg-tertiary/80">
                      <Ellipsis />
                    </Button.Icon>
                  )}
                />
              );
            })}
            {templateMenu.menuState ? <ContextMenu x={templateMenu.menuState.x} y={templateMenu.menuState.y} items={buildTemplateMenuItems(templateMenu.menuState.data)} onClose={templateMenu.close} /> : null}
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

function TemplateKindIcon({ kind }: { kind: Template['kind'] }) {
  if (kind === 'lyrics') {
    return <Music size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
  }
  if (kind === 'overlays') {
    return <Layers size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
  }
  return <Presentation size={14} strokeWidth={1.75} className="shrink-0 text-tertiary" />;
}

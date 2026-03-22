import { ContextMenu } from '../../../components/context-menu';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { PanelSection } from '../../../components/panel-section';
import { useCreateTemplateMenu } from '../../../hooks/use-create-template-menu';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import type { Template } from '@core/types';
import { ObjectListPanel } from '../../slide-editor/components/object-list-panel';
import { PanelRoute } from '../../workbench/components/panel-route';
import { TemplateCard } from './template-card';

export function TemplateListPanel() {
  const { templates, currentTemplateId, openTemplateEditor, createTemplate } = useTemplateEditor();
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreateTemplateMenu({ createTemplate });

  function handleOpenCreateMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
  }

  function renderTemplateCard(template: Template) {
    function handleSelect() {
      openTemplateEditor(template.id);
    }

    return (
      <TemplateCard
        key={template.id}
        template={template}
        selected={template.id === currentTemplateId}
        onClick={handleSelect}
      />
    );
  }

  return (
    <aside data-ui-region="template-list-panel" className="h-full min-h-0 overflow-hidden border-r border-border-primary bg-primary">
      <PanelRoute.Split splitId="template-list-panel" orientation="vertical" className="h-full">
        <PanelRoute.Panel id="template-list" defaultSize={420} minSize={180}>
          <PanelSection
            title={<span className="text-sm font-medium text-text-primary">Templates</span>}
            action={(
              <IconButton label="Create template" size="sm" onClick={handleOpenCreateMenu}>
                <Icon.plus size={14} strokeWidth={2} />
              </IconButton>
            )}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <div className="grid content-start gap-2">{templates.map(renderTemplateCard)}</div>
          </PanelSection>
        </PanelRoute.Panel>
        <PanelRoute.Panel id="template-objects" defaultSize={220} minSize={160}>
          <PanelSection
            title={<span className="text-sm font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-t border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        </PanelRoute.Panel>
      </PanelRoute.Split>
      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </aside>
  );
}

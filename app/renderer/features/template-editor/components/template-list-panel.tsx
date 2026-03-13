import { ContextMenu } from '../../../components/context-menu';
import { Icon } from '../../../components/icon';
import { IconButton } from '../../../components/icon-button';
import { PanelSection } from '../../../components/panel-section';
import { TwoPaneVerticalSplit } from '../../../components/resizable-split';
import { useCreateTemplateMenu } from '../../../hooks/use-create-template-menu';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import type { Template } from '@core/types';
import { ObjectListPanel } from '../../slide-editor/components/object-list-panel';
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
      <TwoPaneVerticalSplit
        className="h-full"
        topPaneId="template-list"
        bottomPaneId="template-objects"
        defaultTopSize={420}
        defaultBottomSize={220}
        minTopSize={180}
        minBottomSize={160}
        topPane={(
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
        )}
        bottomPane={(
          <PanelSection
            title={<span className="text-sm font-medium text-text-primary">Objects</span>}
            headerClassName="border-b border-border-primary"
            bodyClassName="overflow-y-auto p-2"
          >
            <ObjectListPanel />
          </PanelSection>
        )}
      />
      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </aside>
  );
}

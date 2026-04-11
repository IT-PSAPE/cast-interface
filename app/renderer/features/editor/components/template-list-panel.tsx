import type { Id, Template } from '@core/types';
import { Ellipsis, Layers, Music, Presentation, Trash2 } from 'lucide-react';
import { Button } from '../../../components/controls/button';
import { ContextMenu, type ContextMenuItem } from '../../../components/overlays/context-menu';
import { useCreateTemplateMenu } from '../../../hooks/use-create-template-menu';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneThumbnailCard } from '../../../components/display/scene-thumbnail-card';
import { ItemListPanel } from './item-list-panel';
import { useContextMenuState } from '../../../hooks/use-context-menu-state';

function TemplateKindIcon({ kind }: { kind: Template['kind'] }) {
  if (kind === 'lyrics') {
    return <Music size={14} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />;
  }
  if (kind === 'overlays') {
    return <Layers size={14} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />;
  }
  return <Presentation size={14} strokeWidth={1.75} className="shrink-0 text-text-tertiary" />;
}

export function TemplateListPanel() {
  const { templates, currentTemplateId, openTemplateEditor, createTemplate, deleteTemplate } = useTemplateEditor();
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreateTemplateMenu({ createTemplate });
  const templateMenu = useContextMenuState<Id>();

  function handleOpenCreateMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
  }

  function handleDeleteTemplate(templateId: Id) {
    if (!window.confirm('Delete this template? Content items using it will keep their current elements but lose the template association.')) return;
    deleteTemplate(templateId);
  }

  function buildTemplateMenuItems(templateId: Id): ContextMenuItem[] {
    return [
      { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onSelect: () => handleDeleteTemplate(templateId) },
    ];
  }

  return (
    <ItemListPanel
      title="Templates"
      splitId="template-list-panel"
      listPanelId="template-list"
      objectsPanelId="template-objects"
      onAdd={handleOpenCreateMenu}
      addLabel="Create template"
      contextMenu={menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    >
      {templates.map((template, index) => (
        <TemplateListCard
          key={template.id}
          template={template}
          index={index}
          isSelected={template.id === currentTemplateId}
          onSelect={openTemplateEditor}
          onOpenMenu={templateMenu.openFromButton}
        />
      ))}
      {templateMenu.menuState ? <ContextMenu x={templateMenu.menuState.x} y={templateMenu.menuState.y} items={buildTemplateMenuItems(templateMenu.menuState.data)} onClose={templateMenu.close} /> : null}
    </ItemListPanel>
  );
}

interface TemplateListCardProps {
  template: Template;
  index: number;
  isSelected: boolean;
  onSelect: (id: Id) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function TemplateListCard({ template, index, isSelected, onSelect, onOpenMenu }: TemplateListCardProps) {
  const scene = buildRenderScene(null, template.elements);

  function handleSelect() {
    onSelect(template.id);
  }

  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenMenu(event.currentTarget, template.id);
  }

  return (
    <SceneThumbnailCard
      scene={scene}
      index={index}
      label={template.name}
      secondaryText={template.name}
      selected={isSelected}
      onClick={handleSelect}
      captionIcon={<TemplateKindIcon kind={template.kind} />}
      menuButton={(
        <Button.Icon label="Template options" onClick={handleMenuClick} size="sm" className="border-border-primary bg-background-tertiary/80">
          <Ellipsis size={14} strokeWidth={2} />
        </Button.Icon>
      )}
    />
  );
}

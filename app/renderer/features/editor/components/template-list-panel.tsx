import { useState } from 'react';
import type { Id, Template } from '@core/types';
import { Ellipsis, Layers, Music, Presentation, Trash2 } from 'lucide-react';
import { Button } from '../../../components/controls/button';
import { ContextMenu, type ContextMenuItem } from '../../../components/overlays/context-menu';
import { useCreateTemplateMenu } from '../../../hooks/use-create-template-menu';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneThumbnailCard } from '../../../components/display/scene-thumbnail-card';
import { ItemListPanel } from './item-list-panel';

interface TemplateMenuState {
  x: number;
  y: number;
  templateId: Id;
}

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
  const [templateMenuState, setTemplateMenuState] = useState<TemplateMenuState | null>(null);

  function handleOpenCreateMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
  }

  function handleOpenTemplateMenu(button: HTMLButtonElement, templateId: Id) {
    const rect = button.getBoundingClientRect();
    setTemplateMenuState({ x: rect.left, y: rect.bottom + 4, templateId });
  }

  function handleCloseTemplateMenu() {
    setTemplateMenuState(null);
  }

  function handleDeleteTemplate(templateId: Id) {
    if (!window.confirm('Delete this template? Content items using it will keep their current elements but lose the template association.')) return;
    deleteTemplate(templateId);
  }

  function buildTemplateMenuItems(templateId: Id): ContextMenuItem[] {
    return [
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 size={14} />,
        danger: true,
        onSelect: () => handleDeleteTemplate(templateId),
      },
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
      {templates.map((template) => {
        const scene = buildRenderScene(null, template.elements);

        function handleSelect() {
          openTemplateEditor(template.id);
        }

        function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
          event.stopPropagation();
          handleOpenTemplateMenu(event.currentTarget as HTMLButtonElement, template.id);
        }

        return (
          <SceneThumbnailCard
            key={template.id}
            scene={scene}
            index={templates.indexOf(template)}
            label={template.name}
            secondaryText={template.name}
            selected={template.id === currentTemplateId}
            onClick={handleSelect}
            captionIcon={<TemplateKindIcon kind={template.kind} />}
            menuButton={(
              <Button label="Template options" onClick={handleMenuClick} size="icon-sm" className="border-border-primary bg-background-tertiary/80">
                <Ellipsis size={14} strokeWidth={2} />
              </Button>
            )}
          />
        );
      })}
      {templateMenuState ? <ContextMenu x={templateMenuState.x} y={templateMenuState.y} items={buildTemplateMenuItems(templateMenuState.templateId)} onClose={handleCloseTemplateMenu} /> : null}
    </ItemListPanel>
  );
}

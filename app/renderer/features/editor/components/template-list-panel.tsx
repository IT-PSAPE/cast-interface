import type { Template } from '@core/types';
import { Ellipsis, Layers, Music, Presentation } from 'lucide-react';
import { IconButton } from '../../../components/controls/icon-button';
import { ContextMenu } from '../../../components/overlays/context-menu';
import { useCreateTemplateMenu } from '../../../hooks/use-create-template-menu';
import { useTemplateEditor } from '../../../contexts/template-editor-context';
import { buildRenderScene } from '../../stage/rendering/build-render-scene';
import { SceneThumbnailCard } from '../../../components/display/scene-thumbnail-card';
import { ItemListPanel } from './item-list-panel';

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
  const { templates, currentTemplateId, openTemplateEditor, createTemplate } = useTemplateEditor();
  const { menuItems, menuState, openMenuFromButton, closeMenu } = useCreateTemplateMenu({ createTemplate });

  function handleOpenCreateMenu(event: React.MouseEvent<HTMLButtonElement>) {
    openMenuFromButton(event.currentTarget);
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

        function handleOpenMenu(button: HTMLButtonElement) {
          // Template-specific menu button handling could go here
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
              <IconButton label="Template options" onClick={(e) => { e.stopPropagation(); handleOpenMenu(e.currentTarget as HTMLButtonElement); }} size="sm" className="border-border-primary bg-background-tertiary/80">
                <Ellipsis size={14} strokeWidth={2} />
              </IconButton>
            )}
          />
        );
      })}
    </ItemListPanel>
  );
}

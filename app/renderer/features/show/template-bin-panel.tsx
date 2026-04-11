import { useMemo } from 'react';
import type { Id, Template } from '@core/types';
import { ContextMenu, type ContextMenuItem } from '../../components/overlays/context-menu';
import { useNavigation } from '../../contexts/navigation-context';
import { useOverlayEditor } from '../../contexts/overlay-editor/overlay-editor-context';
import { useTemplateEditor } from '../../contexts/template-editor-context';
import { useProjectContent } from '../../contexts/use-project-content';
import { useWorkbench } from '../../contexts/workbench-context';
import { Ellipsis } from 'lucide-react';
import { Button } from '../../components/controls/button';
import { ThumbnailGrid } from '../../components/layout/thumbnail-grid';
import { buildRenderScene } from '../stage/build-render-scene';
import { SceneThumbnailCard } from '../../components/display/scene-thumbnail-card';
import { useContextMenuState } from '../../hooks/use-context-menu-state';
import { filterByText } from '../../utils/filter-by-text';

interface TemplateBinPanelProps {
  filterText: string;
  gridItemSize: number;
}

export function TemplateBinPanel({ filterText, gridItemSize }: TemplateBinPanelProps) {
  const { templates } = useProjectContent();
  const { currentPlaylistContentItem, currentContentItem } = useNavigation();
  const { currentOverlay } = useOverlayEditor();
  const { state: { workbenchMode }, actions: { setWorkbenchMode } } = useWorkbench();
  const {
    applyTemplateToTarget,
    currentTemplateId,
    deleteTemplate,
    duplicateTemplate,
    openTemplateEditor,
    renameTemplate,
  } = useTemplateEditor();
  const menu = useContextMenuState<Id>();

  const filteredTemplates = filterByText(templates, filterText, (t) => [t.name, t.kind]);
  const activeContentItem = currentPlaylistContentItem ?? currentContentItem;

  function resolvePreviewTarget(template: Template) {
    if (template.kind === 'overlays' && workbenchMode === 'overlay-editor' && currentOverlay) {
      return { type: 'overlay' as const, overlayId: currentOverlay.id };
    }
    if (!activeContentItem) return null;
    if (template.kind === 'lyrics' && activeContentItem.type === 'lyric') {
      return { type: 'content-item' as const, itemId: activeContentItem.id };
    }
    if (template.kind === 'slides' && activeContentItem.type === 'deck') {
      return { type: 'content-item' as const, itemId: activeContentItem.id };
    }
    return null;
  }

  function handleOpenTemplate(template: Template) {
    openTemplateEditor(template.id);
    setWorkbenchMode('template-editor');
  }

  function handleApplyTemplate(template: Template) {
    const target = resolvePreviewTarget(template);
    if (!target) return;
    void applyTemplateToTarget(template.id, target);
  }

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menu.menuState) return [];
    const template = templates.find((item) => item.id === menu.menuState!.data) ?? null;
    if (!template) return [];
    const previewTarget = resolvePreviewTarget(template);
    return [
      {
        id: 'apply-template',
        label: previewTarget?.type === 'overlay'
          ? 'Apply to Current Overlay'
          : 'Apply and Assign to Current Item',
        disabled: !previewTarget,
        onSelect: () => handleApplyTemplate(template),
      },
      { id: 'edit-template', label: 'Edit Template', onSelect: () => handleOpenTemplate(template) },
      {
        id: 'rename-template', label: 'Rename', onSelect: () => {
          const nextName = window.prompt('Rename template', template.name)?.trim();
          if (!nextName) return;
          renameTemplate(template.id, nextName);
        }
      },
      { id: 'duplicate-template', label: 'Duplicate', onSelect: () => duplicateTemplate(template.id) },
      {
        id: 'delete-template', label: 'Delete', danger: true, onSelect: () => {
          if (!window.confirm('Delete this template?')) return;
          deleteTemplate(template.id);
        }
      },
    ];
  }, [menu.menuState, templates]);

  return (
    <>
      <ThumbnailGrid itemSize={gridItemSize}>
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            index={filteredTemplates.indexOf(template)}
            isSelected={template.id === currentTemplateId}
            onOpen={handleOpenTemplate}
            onOpenMenu={menu.openFromButton}
          />
        ))}
      </ThumbnailGrid>
      {menu.menuState ? <ContextMenu x={menu.menuState.x} y={menu.menuState.y} items={menuItems} onClose={menu.close} /> : null}
    </>
  );
}

interface TemplateCardProps {
  template: Template;
  index: number;
  isSelected: boolean;
  onOpen: (template: Template) => void;
  onOpenMenu: (button: HTMLElement, data: Id) => void;
}

function TemplateCard({ template, index, isSelected, onOpen, onOpenMenu }: TemplateCardProps) {
  const scene = buildRenderScene(null, template.elements);

  function handleOpen() {
    onOpen(template);
  }

  function handleMenuClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenMenu(e.currentTarget, template.id);
  }

  return (
    <SceneThumbnailCard
      scene={scene}
      index={index}
      label={template.name}
      secondaryText={template.name}
      selected={isSelected}
      onClick={handleOpen}
      onDoubleClick={handleOpen}
      menuButton={(
        <Button.Icon label="Template options" onClick={handleMenuClick} size="sm" className="border-primary bg-tertiary/80">
          <Ellipsis size={14} strokeWidth={2} />
        </Button.Icon>
      )}
    />
  );
}

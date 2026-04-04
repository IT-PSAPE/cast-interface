import { useMemo, useState } from 'react';
import type { Id, Template } from '@core/types';
import { ContextMenu, type ContextMenuItem } from '../../../../components/overlays/context-menu';
import { useNavigation } from '../../../../contexts/navigation-context';
import { useOverlayEditor } from '../../../../contexts/overlay-editor/overlay-editor-context';
import { useTemplateEditor } from '../../../../contexts/template-editor-context';
import { useProjectContent } from '../../../../contexts/use-project-content';
import { useWorkbench } from '../../../../contexts/workbench-context';
import { Ellipsis } from 'lucide-react';
import { Button } from '../../../../components/controls/button';
import { buildRenderScene } from '../../../stage/rendering/build-render-scene';
import { SceneThumbnailCard } from '../../../../components/display/scene-thumbnail-card';

interface TemplateBinPanelProps {
  filterText: string;
}

interface MenuState {
  templateId: Id;
  x: number;
  y: number;
}

export function TemplateBinPanel({ filterText }: TemplateBinPanelProps) {
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
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (!normalizedFilter) return true;
      return template.name.toLowerCase().includes(normalizedFilter) || template.kind.toLowerCase().includes(normalizedFilter);
    });
  }, [normalizedFilter, templates]);

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

  function openMenu(templateId: Id, button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    setMenuState({ templateId, x: rect.left, y: rect.bottom + 4 });
  }

  function closeMenu() {
    setMenuState(null);
  }

  function handleOpenTemplate(template: Template) {
    openTemplateEditor(template.id);
    setWorkbenchMode('template-editor');
  }

  function handleEditTemplate(template: Template) {
    openTemplateEditor(template.id);
    setWorkbenchMode('template-editor');
  }

  function handleApplyTemplate(template: Template) {
    const nextPreviewTarget = resolvePreviewTarget(template);
    if (!nextPreviewTarget) return;
    void applyTemplateToTarget(template.id, nextPreviewTarget);
  }

  function handleRenameTemplate(template: Template) {
    const nextName = window.prompt('Rename template', template.name)?.trim();
    if (!nextName) return;
    renameTemplate(template.id, nextName);
  }

  function handleDuplicateTemplate(template: Template) {
    duplicateTemplate(template.id);
  }

  function handleDeleteTemplate(template: Template) {
    if (!window.confirm('Delete this template?')) return;
    deleteTemplate(template.id);
  }

  const menuItems = useMemo<ContextMenuItem[]>(() => {
    if (!menuState) return [];
    const template = templates.find((item) => item.id === menuState.templateId) ?? null;
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
      { id: 'edit-template', label: 'Edit Template', onSelect: () => handleEditTemplate(template) },
      { id: 'rename-template', label: 'Rename', onSelect: () => handleRenameTemplate(template) },
      { id: 'duplicate-template', label: 'Duplicate', onSelect: () => handleDuplicateTemplate(template) },
      { id: 'delete-template', label: 'Delete', danger: true, onSelect: () => handleDeleteTemplate(template) },
    ];
  }, [menuState, templates]);

  function renderTemplateCard(template: Template) {
    function handleOpen() {
      handleOpenTemplate(template);
    }

    function handleEdit() {
      handleEditTemplate(template);
    }

    function handleOpenMenu(button: HTMLButtonElement) {
      openMenu(template.id, button);
    }

    const scene = buildRenderScene(null, template.elements);
    return (
      <SceneThumbnailCard
        key={template.id}
        scene={scene}
        index={filteredTemplates.indexOf(template)}
        label={template.name}
        secondaryText={template.name}
        selected={template.id === currentTemplateId}
        onClick={handleOpen}
        onDoubleClick={handleEdit}
        menuButton={(
          <Button label="Template options" onClick={(e) => { e.stopPropagation(); handleOpenMenu(e.currentTarget as HTMLButtonElement); }} size="icon-sm" className="border-border-primary bg-background-tertiary/80">
            <Ellipsis size={14} strokeWidth={2} />
          </Button>
        )}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">{filteredTemplates.map(renderTemplateCard)}</div>
      {menuState ? <ContextMenu x={menuState.x} y={menuState.y} items={menuItems} onClose={closeMenu} /> : null}
    </>
  );
}
